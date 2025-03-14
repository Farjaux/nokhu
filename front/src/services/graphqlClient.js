import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:5000/graphql', // Backend GraphQL endpoint
  cache: new InMemoryCache(),
});

export default client;
