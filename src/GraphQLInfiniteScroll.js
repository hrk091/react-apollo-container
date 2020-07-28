// @flow

import React, { Component } from "react"
import InfiniteScroll from "react-infinite-scroller"
import type { ConnectionQueryData, ConnectionQueryProps } from "./types"


export function graphqlConcatResultNodes<A, T>(
  typename: A,
  prev: ConnectionQueryData<A, T>,
  next: { fetchMoreResult: ConnectionQueryData<A, T> }
): ConnectionQueryData<A, T> {
  if (!next || !next.fetchMoreResult) {
    console.warn(`fetchMore result might be wrong: ${next}`)
    return prev
  }
  const { fetchMoreResult } = next
  const newEdges = fetchMoreResult[typename].edges
  const pageInfo = fetchMoreResult[typename].pageInfo
  let res: ConnectionQueryData<A, T>
  // fetchMore中に別のqueryが実行されるとタイミングによってprevがundefinedになりうる
  if (prev) {
    res = {
      // $FlowFixMe: typenameはgenericsでinjectionするが、型はstring
      [typename]: Object.assign({}, prev[typename], {
        edges: [...prev[typename].edges, ...newEdges],
        pageInfo
      })
    }
  } else {
    res = {
      // $FlowFixMe
      [typename]: Object.assign(
        {},
        {
          edges: [...newEdges],
          pageInfo,
          // 下記がないとwarningが出る
          totalCount: 0,
          __typename: ""
        }
      )
    }
  }
  return res
}

export default class GraphQLInfiniteScroll<A, T> extends Component<ConnectionQueryProps<A, T>> {
  /**
   * graphQLと連携し、infinite scroll paginationを提供するcomponent
   * Relay formatのpagenationに対応したgraphQLに対応
  */
  onLoadMore = () => {
    const { typename, data } = this.props
    if (!data || !data[typename] || !data[typename].pageInfo) {
      return
    }
    this.props.fetchMore({
      variables: {
        cursor: data[typename].pageInfo.endCursor
      },
      updateQuery: graphqlConcatResultNodes.bind(null, typename)
    })
  }

  render() {
    const { typename, data, loading, error } = this.props
    if (error) {
      console.error(error)
      return (
        <>
          <h3>データ取得エラー</h3>
          <h5>エラーが発生しました。ページをリロードしてください。</h5>
          <h5>事象が改善しない場合は、管理者にお問い合わせください。</h5>
        </>
      )
    }
    if (!data || !data[typename] || !data[typename].pageInfo) {
      return null
    }
    if (loading) {
      return <h3>Loading...</h3>
    }

    const { hasNextPage } = data[typename].pageInfo
    const records = data[typename].edges.filter(Boolean).map((edge: any) => edge.node)
    const { children: Children } = this.props

    return (
      <InfiniteScroll loadMore={this.onLoadMore} hasMore={hasNextPage} loader={<h3>Loading...</h3>} >
        <Children records={records} total={data[typename].totalCount} />
      </InfiniteScroll>
    )
  }
}
