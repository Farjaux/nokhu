import { gql } from '@apollo/client';

export const GET_ALL_CATEGORIES = gql`
  query {
    getAllCategories {
      id
      name
      subcategories {
        id
        name
        subcategories {
          id
          name
        }
      }
    }
  }
`;

export const GET_PARENT_CATEGORIES = gql`
  query getAllCategories {
    getAllCategories {
      id
      name
    }
  }
`;

export const GET_SUBCATEGORIES = gql`
  query getCategory($id: ID!) {
    getCategory(id: $id) {
      id
      name
      subcategories {
        id
        name
      }
    }
  }
`;
