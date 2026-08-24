import { docsSearchRateLimitPolicy } from "./rate-limit";
import {
  developerResourcesRoute,
  docsApiDeprecationDocumentationRoute,
  docsSearchApiRoute,
  legacyDocsSearchApiRoute,
  legacyDocsSearchDeprecationDate,
  openApiRoute,
  siteUrl,
} from "./shared";

const documentationUrl = `${siteUrl}${developerResourcesRoute}`;
const deprecationDocumentationUrl = `${siteUrl}${docsApiDeprecationDocumentationRoute}`;

const searchParameters = [
  {
    name: "query",
    in: "query",
    required: false,
    description: "Text to find in the LPM CLI documentation.",
    schema: { type: "string" },
    example: "install",
  },
  {
    name: "limit",
    in: "query",
    required: false,
    description: "Maximum number of results.",
    schema: { type: "integer" },
    example: 10,
  },
  {
    name: "tag",
    in: "query",
    required: false,
    description: "Comma-separated documentation tags.",
    schema: { type: "string" },
  },
] as const;

const rateLimitResponseHeaders = {
  RateLimit: { $ref: "#/components/headers/RateLimit" },
  "RateLimit-Policy": { $ref: "#/components/headers/RateLimitPolicy" },
  "X-RateLimit-Limit": { $ref: "#/components/headers/XRateLimitLimit" },
  "X-RateLimit-Remaining": {
    $ref: "#/components/headers/XRateLimitRemaining",
  },
  "X-RateLimit-Reset": { $ref: "#/components/headers/XRateLimitReset" },
} as const;

const deprecationResponseHeaders = {
  Deprecation: { $ref: "#/components/headers/Deprecation" },
  Link: { $ref: "#/components/headers/DeprecationLink" },
} as const;

export const openApiDocument = {
  openapi: "3.1.1",
  jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
  info: {
    title: "LPM CLI Documentation API",
    version: "1.1.0",
    description:
      "Search the public LPM CLI documentation. Major versions use /api/vN paths. This API does not manage LPM.dev Registry accounts or packages.",
    license: { name: "MIT", identifier: "MIT" },
  },
  externalDocs: {
    description: "LPM CLI developer resources",
    url: documentationUrl,
  },
  servers: [{ url: siteUrl, description: "LPM CLI documentation" }],
  security: [],
  tags: [
    {
      name: "Documentation",
      description: "Public LPM CLI documentation search.",
    },
  ],
  paths: {
    [docsSearchApiRoute]: {
      get: {
        operationId: "searchLpmCliDocumentation",
        summary: "Search LPM CLI documentation",
        description:
          "Returns matching pages, headings, and text fragments. An empty or omitted query returns an empty array.",
        tags: ["Documentation"],
        parameters: searchParameters,
        responses: {
          "200": { $ref: "#/components/responses/SearchSuccess" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
        "x-api-version": "1",
      },
    },
    [legacyDocsSearchApiRoute]: {
      get: {
        operationId: "searchLpmCliDocumentationLegacy",
        summary: "Search LPM CLI documentation with the legacy path",
        description:
          "Deprecated path for the version 1 documentation search. Use /api/v1/search for new integrations.",
        deprecated: true,
        externalDocs: {
          description: "Versioning and deprecation policy",
          url: deprecationDocumentationUrl,
        },
        tags: ["Documentation"],
        parameters: searchParameters,
        responses: {
          "200": { $ref: "#/components/responses/DeprecatedSearchSuccess" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
          "429": { $ref: "#/components/responses/DeprecatedRateLimited" },
          "500": {
            $ref: "#/components/responses/DeprecatedInternalError",
          },
        },
        "x-api-version": "1",
      },
    },
  },
  components: {
    headers: {
      RateLimit: {
        description:
          "Available quota and effective window in the current IETF RateLimit header format.",
        schema: { type: "string" },
        example: `"${docsSearchRateLimitPolicy.name}";r=42;t=30`,
      },
      RateLimitPolicy: {
        description:
          "Quota and window in the current IETF RateLimit-Policy header format.",
        schema: { type: "string" },
        example: `"${docsSearchRateLimitPolicy.name}";q=${docsSearchRateLimitPolicy.quota};w=${docsSearchRateLimitPolicy.windowSeconds}`,
      },
      XRateLimitLimit: {
        description: "Request quota for clients that use legacy headers.",
        schema: { type: "integer", minimum: 1 },
        example: docsSearchRateLimitPolicy.quota,
      },
      XRateLimitRemaining: {
        description: "Available requests for clients that use legacy headers.",
        schema: { type: "integer", minimum: 0 },
        example: 42,
      },
      XRateLimitReset: {
        description:
          "Unix timestamp when the fixed quota window resets, for clients that use legacy headers.",
        schema: { type: "integer", minimum: 0 },
        example: 1787533200,
      },
      RetryAfter: {
        description: "Seconds to wait before another request.",
        schema: { type: "integer", minimum: 1 },
        example: 30,
      },
      Deprecation: {
        description:
          "RFC 9745 Structured Field Date when the legacy path was deprecated.",
        schema: { type: "string", pattern: "^@[0-9]+$" },
        example: legacyDocsSearchDeprecationDate,
      },
      DeprecationLink: {
        description:
          "RFC 8288 link to the versioning and deprecation policy, with the RFC 9745 deprecation relation.",
        schema: { type: "string" },
        example: `<${deprecationDocumentationUrl}>; rel="deprecation"; type="text/html"`,
      },
    },
    schemas: {
      SearchResult: {
        type: "object",
        additionalProperties: false,
        required: ["id", "url", "type", "content"],
        properties: {
          id: {
            type: "string",
            description: "Stable result identifier.",
          },
          url: {
            type: "string",
            description: "Documentation path and optional heading fragment.",
            example: "/docs/packages/install#quickstart",
          },
          type: {
            type: "string",
            enum: ["page", "heading", "text"],
          },
          content: {
            type: "string",
            description:
              "Matched text. Matches can use Markdown mark elements.",
          },
          breadcrumbs: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      Problem: {
        type: "object",
        description:
          "RFC 9457 Problem Details with fields that help agents recover.",
        additionalProperties: true,
        required: [
          "type",
          "title",
          "status",
          "detail",
          "instance",
          "code",
          "message",
          "resolution",
          "documentation_url",
        ],
        properties: {
          type: { type: "string", format: "uri-reference" },
          title: { type: "string" },
          status: { type: "integer", minimum: 400, maximum: 599 },
          detail: { type: "string" },
          instance: { type: "string", format: "uri-reference" },
          code: { type: "string" },
          message: { type: "string" },
          resolution: { type: "string" },
          documentation_url: { type: "string", format: "uri" },
        },
      },
      RateLimitProblem: {
        allOf: [
          { $ref: "#/components/schemas/Problem" },
          {
            type: "object",
            required: ["violated-policies"],
            properties: {
              "violated-policies": {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        ],
      },
    },
    responses: {
      SearchSuccess: {
        description: "Matching documentation entries.",
        headers: rateLimitResponseHeaders,
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: { $ref: "#/components/schemas/SearchResult" },
            },
          },
        },
      },
      DeprecatedSearchSuccess: {
        description: "Matching documentation entries from the legacy path.",
        headers: {
          ...rateLimitResponseHeaders,
          ...deprecationResponseHeaders,
        },
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: { $ref: "#/components/schemas/SearchResult" },
            },
          },
        },
      },
      MethodNotAllowed: {
        description: "The route does not support the request method.",
        headers: {
          Allow: {
            description: "Supported methods.",
            schema: { type: "string" },
          },
        },
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/Problem" },
          },
        },
      },
      RateLimited: {
        description: "The request quota is exhausted.",
        headers: {
          ...rateLimitResponseHeaders,
          "Retry-After": { $ref: "#/components/headers/RetryAfter" },
        },
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/RateLimitProblem" },
          },
        },
      },
      DeprecatedRateLimited: {
        description: "The request quota is exhausted on the legacy path.",
        headers: {
          ...rateLimitResponseHeaders,
          ...deprecationResponseHeaders,
          "Retry-After": { $ref: "#/components/headers/RetryAfter" },
        },
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/RateLimitProblem" },
          },
        },
      },
      InternalError: {
        description: "The documentation search failed.",
        headers: rateLimitResponseHeaders,
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/Problem" },
          },
        },
      },
      DeprecatedInternalError: {
        description: "The documentation search failed on the legacy path.",
        headers: {
          ...rateLimitResponseHeaders,
          ...deprecationResponseHeaders,
        },
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/Problem" },
          },
        },
      },
    },
  },
} as const;

export const openApiUrl = `${siteUrl}${openApiRoute}`;
