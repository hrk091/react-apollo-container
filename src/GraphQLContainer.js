// @flow

import React, { Component } from "react"
import type { NodeQueryProps } from "./types"

export default class GraphQLContainer<A, T> extends Component<NodeQueryProps<A, T>> {

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
    if (loading) {
      return <h3>Loading...</h3>
    }
    if (!data || !data[typename]) {
      return <h5>データが見つかりません。</h5>
    }

    const { children: Children } = this.props
    return <Children data={data[typename]} />
  }
}
