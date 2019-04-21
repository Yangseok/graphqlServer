const { GraphQLServer } = require('graphql-yoga')

// 런타임 시 링크를 저장하는 데 사용됨. (지금의 모든것은 데이터베이스에 저장되기보다는 메모리에 저장됨.)
let links = [{
  id: 'link-0',
  url: 'www.howtographql.com',
  description: 'Fullstack tutorial for GraphQL'
}]

//
let idCount = links.length

//GraphQL 스키마 실제 구현
const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    // feed 타입에 맞게 데이터를 입력
    feed: () => links,
  },
  Mutation: {
    //
    post: (parent, args) => {
      const link = {
        id: `link-${idCount++}`,
        description: args.description,
        url: args.url
      }
      links.push(link)
      return link
    }
  },
  // Link 스키마에 정의된 유형에 대해 추가
  Link: {
    id: (parent) => parent.id,
    description: (parent) => parent.description,
    url: (parent) => parent.url,
  }
}

//스키마와 리졸버를 GraphQL 서버로 전달. 서버에 허용되는 API 작업과 해결 방법을 서버에 알려줌.
const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers
})

server.start(() => console.log(`Server is running on http://localhost:4000`))