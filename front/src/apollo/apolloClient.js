// src/apollo/apolloClient.js

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloLink,
} from '@apollo/client';
import { accessTokenVar } from './tokenVar';

let isRefreshing = false;

// 1) Outgoing request interceptor
const authLink = new ApolloLink((operation, forward) => {
  if (isRefreshing) {
    console.log('Preventing duplicate token refresh.');
    return forward(operation);
  }

  const token = accessTokenVar();
  console.log('apolloClient authLink', token);
  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }));
  }
  return forward(operation);
});

// 2) Incoming response interceptor
const responseLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    const context = operation.getContext();
    const { response: httpResponse } = context;
    if (httpResponse?.headers) {
      // Check for a newly refreshed token
      const newToken = httpResponse.headers.get('x-refreshed-token');

      if (newToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          console.log('🔄 Token refreshed:', newToken);
          accessTokenVar(newToken);

          setTimeout(() => {
            isRefreshing = false;
          }, 5000);
        }
      }
    }
    return response;
  });
});

const httpLink = new HttpLink({
  uri: 'http://localhost:5000/graphql',
  credentials: 'include',
});

const link = ApolloLink.from([authLink, responseLink, httpLink]);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export default client;
