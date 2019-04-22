const { GraphQLServer } = require('graphql-yoga')
const { prisma } = require('./generated/prisma-client')
const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')
const User = require('./resolvers/User')
const Link = require('./resolvers/Link')
const Subscription = require('./resolvers/Subscription')
const Vote = require('./resolvers/Vote')

//GraphQL 스키마 실제 구현
const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
  Link,
  Vote,
}

//스키마와 리졸버를 GraphQL 서버로 전달. 서버에 허용되는 API 작업과 해결 방법을 서버에 알려줌.
const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: request => {
    return {
      ...request,
      prisma,
    }
  },
})

server.start(() => console.log(`Server is running on http://localhost:4000`))