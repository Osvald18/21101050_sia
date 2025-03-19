const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { PubSub } = require("graphql-subscriptions");

// Initialize Prisma and PubSub
const prisma = new PrismaClient();
const pubsub = new PubSub();

// Express app setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// GraphQL Schema
const typeDefs = `#graphql
  type Post {
    id: ID!
    title: String!
    content: String!
    authorId: Int!
  }

  type Query {
    posts: [Post!]!
  }

  type Mutation {
    createPost(title: String!, content: String!, authorId: Int!): Post!
  }

  type Subscription {
    postAdded: Post!
  }
`;

const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
  },
  Mutation: {
    createPost: async (_, { title, content, authorId }) => {
      const newPost = await prisma.post.create({
        data: { title, content, authorId },
      });

      // Publish the new post event
      pubsub.publish("POST_ADDED", { postAdded: newPost });

      return newPost;
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(["POST_ADDED"]),
    },
  },
};

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create WebSocket server for subscriptions
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
useServer({ schema }, wsServer);

// Create Apollo Server
const server = new ApolloServer({ schema });

async function startServer() {
  await server.start();
  
  app.use("/graphql", expressMiddleware(server));

  httpServer.listen(4002, () => {
    console.log("🚀 GraphQL & WebSocket Server running on http://localhost:4002/graphql");
  });
}

startServer();


