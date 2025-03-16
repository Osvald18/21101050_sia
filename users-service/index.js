const { ApolloServer, gql } = require("apollo-server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    updateUser(id: ID!, name: String, email: String): User!
    deleteUser(id: ID!): User!
  }
`;

const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, { id }) => prisma.user.findUnique({ where: { id: parseInt(id) } }),
  },
  Mutation: {
    createUser: (_, { name, email }) => prisma.user.create({ data: { name, email } }),
    updateUser: (_, { id, name, email }) =>
      prisma.user.update({ where: { id: parseInt(id) }, data: { name, email } }),
    deleteUser: (_, { id }) => prisma.user.delete({ where: { id: parseInt(id) } }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Users service running at ${url}`);
});
