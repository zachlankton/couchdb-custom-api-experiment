"use strict";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { throwHttpError } from "../lib/utils.js";
import { FastifyPluginAsync } from "fastify";
import type { FastifyRequest } from "fastify/types/request.js";
import type { FastifyReply } from "fastify/types/reply.js";
import { Readable } from "node:stream";

const publicKey = `-----BEGIN PUBLIC KEY-----

-----END PUBLIC KEY-----
`;

const privateKey = `-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----
`;

interface SessionPayload {
  exp: number;
  iat: number;
  sub: string;
  iss: string;
  email?: string;
  username?: string;
  firstName: string;
  lastName: string;
  image: string;
  hasImage: boolean;
  meta: any;
}

export async function generateJWT(
  {
    firstName,
    lastName,
    email,
    username,
    sub,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    sub: string;
  },
  roles: string[] = []
) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
    iat: Math.floor(Date.now() / 1000),
    sub: email || username || sub,
    iss: "ZwcAuthServer",
    email,
    firstName,
    lastName,
    userId: sub,
    "_couchdb.roles": roles,
  };
  const token = await jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { kid: "asdf", alg: "RS256" },
  });
  return token;
}

async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers?.authorization?.slice(7) || "";
  if (!token) {
    reply.status(401).send({ error: "No token provided" });
    throw new Error("No token provided");
  }

  try {
    const jwtToken = jwt.decode<SessionPayload, { alg: string; kid: string }>(
      token
    );

    if (!jwtToken) throw new Error("Invalid token");
    if (!jwtToken.header) throw new Error("Invalid token - requires header");
    if (!jwtToken.header.alg)
      throw new Error("Invalid token - requires alg header");
    if (!jwtToken.payload) throw new Error("Invalid token - requires payload");
    if (!jwtToken.payload.exp)
      throw new Error("Invalid token - requires exp claim");
    if (!jwtToken.payload.iat)
      throw new Error("Invalid token - requires iat claim");
    if (!jwtToken.payload.sub)
      throw new Error("Invalid token - requires sub claim");
    if (!jwtToken.payload.iss)
      throw new Error("Invalid token - requires iss claim");
    if (!jwtToken.payload.email && !jwtToken.payload.username)
      throw new Error("Invalid token - requires email or username claim");

    const algorithm = jwtToken.header.alg;

    await jwt.verify(token, publicKey, { algorithm, throwError: true });
    request.session = jwtToken.payload;
  } catch (e: any) {
    if (e.message === "EXPIRED") {
      throwHttpError(401, "JWT Token has expired");
    }
    throwHttpError(401, e.message);
  }
}

function setCors(reply: FastifyReply) {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("access-control-max-age", "3600");
  reply.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const serviceUrl = process.env.COUCHDB_URL || "http://127.0.0.1:5984";
console.log({serviceUrl})

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.options("*", function (request, reply) {
    setCors(reply);
    reply.header("cache-control", "max-age=3600");
    reply.send();
  });

  fastify.get("/:database/*", async function (request, reply) {
    setCors(reply);
    await verifyJwt(request, reply);
    delete(request.headers.connection)

    const response = await fetch(`${serviceUrl}${request.raw.url || ""}`, {
      method: "GET",
      headers: request.headers as any,
    });
    if (!response.body) return { failed: true };
    const stream = Readable.fromWeb(response.body);
    return reply.send(stream);
  });

  fastify.post("/:database/*", async function (request, reply) {
    setCors(reply);
    await verifyJwt(request, reply);
    delete(request.headers.connection)

    const response = await fetch(`${serviceUrl}${request.url || ""}`, {
      method: "POST",
      headers: request.headers as any,
    });
    if (!response.body) return { failed: true };
    const stream = Readable.fromWeb(response.body);
    return reply.send(stream);
  });

  fastify.delete("/:database/*", async function (request, reply) {
    setCors(reply);
    await verifyJwt(request, reply);
    delete(request.headers.connection)

    const response = await fetch(`${serviceUrl}${request.raw.url || ""}`, {
      method: "DELETE",
      headers: request.headers as any,
    });
    if (!response.body) return { failed: true };
    const stream = Readable.fromWeb(response.body);
    return reply.send(stream);
  });

  fastify.put("/:database/*", async function (request, reply) {
    setCors(reply);
    await verifyJwt(request, reply);
    delete(request.headers.connection)

    const response = await fetch(`${serviceUrl}${request.raw.url || ""}`, {
      method: "PUT",
      headers: request.headers as any,
    });
    if (!response.body) return { failed: true };
    const stream = Readable.fromWeb(response.body);
    return reply.send(stream);
  });

  fastify.patch("/:database/*", async function (request, reply) {
    setCors(reply);
    await verifyJwt(request, reply);
    delete(request.headers.connection)
    
    const response = await fetch(`${serviceUrl}${request.raw.url || ""}`, {
      method: "PATCH",
      headers: request.headers as any,
    });
    if (!response.body) return { failed: true };
    const stream = Readable.fromWeb(response.body);
    return reply.send(stream);
  });

  fastify.get("/test-jwt", async function (request, reply) {
    const jwt = await generateJWT(
      {
        firstName: "Zach",
        lastName: "Lankton",
        email: "test@test.com",
        username: "zachlankton",
        sub: "test@test.com",
      },
      []
    );

    return { jwt };
  });
};

export default root;
