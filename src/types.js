// @flow

export type NodeQueryProps<A, T> = {
  typename: A,
  children: any,
  data: {
    [A]: T
  },
  loading: boolean,
  error: any,
  networkStatus: number
}

type ConnectionEdge<T> = {
  node: T
}

type ConnectionQuery<T> = {
  totalCount: number,
  pageInfo: {
    hasNextPage: boolean,
    endCursor: string
  },
  edges: Array<ConnectionEdge<T>>
}

export type ConnectionQueryData<A, T> = {
  [A]: ConnectionQuery<T>
}

export type ConnectionQueryProps<A, T> = {
  typename: A,
  children: any,
  data: ConnectionQueryData<A, T>,
  loading: boolean,
  fetchMore: any => void,
  error: any
}
