import {
  developerResourcesRoute,
  docsSearchApiRoute,
  openApiRoute,
  siteUrl,
} from "./shared";

export const openApiDocument = {
  openapi: "3.1.1",
  jsonSchemaDialect: "https://spec.openapis.org/oas/3.1/dialect/base",
  info: {
    title: "LPM CLI Documentation API",
    version: "1.0.0",
    description:
      "Search the public LPM CLI documentation. This API does not manage LPM.dev Registry accounts or packages.",
    license: { name: "MIT", identifier: "MIT" },
  },
  externalDocs: {
    description: "LPM CLI developer resources",
    url: `${siteUrl}${developerResourcesRoute}`,
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
        parameters: [
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
        ],
        responses: {
          "200": {
            description: "Matching documentation entries.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SearchResult" },
                },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
  components: {
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
    },
    responses: {
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
      InternalError: {
        description: "The documentation search failed.",
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
