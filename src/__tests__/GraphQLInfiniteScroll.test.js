import React from "react"
import { MockedProvider } from "@apollo/react-testing"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"

import { useQuery } from "@apollo/react-hooks"
import gql from "graphql-tag"

import { waitForDomChange } from "@testing-library/dom"
import GraphQLInfiniteScroll, { graphqlConcatResultNodes } from "../GraphQLInfiniteScroll"

describe("GraphQLInfiniteScroll", () => {
  // Setup

  const mockQuery = gql`
      query ContactList($cursor: String, $name: String) {
          allContact(first: 10, after: $cursor, name: $name) {
              totalCount
              pageInfo {
                  endCursor
                  hasNextPage
              }
              edges {
                  node {
                      id
                  }
              }
          }
      }
  `
  const variables = {
    name: "dummyName"
  }
  const typename = "allContact"

  function DummyComponent() {
    const queryProps = useQuery(mockQuery, {variables})
    return (
      <GraphQLInfiniteScroll typename={typename} {...queryProps}>
        {({records, total}) => {
          return <div/>
        }}
      </GraphQLInfiniteScroll>
    )
  }

  // Tests

  it("renders loading state initially", () => {
    // Given

    const mocks = [
      {
        request: {query: mockQuery, variables},
        result: {
          data: {
            [typename]: {
              totalCount: 0,
              pageInfo: {
                endCursor: Symbol("endCursor"),
                hasNextPage: false
              },
              edges: []
            }
          }
        }
      }
    ]

    const spy = jest.fn()

    function DummyComponent() {
      const queryProps = useQuery(mockQuery, {variables})
      return (
        <GraphQLInfiniteScroll typename={typename} {...queryProps}>
          {({records, total}) => {
            spy()
            return <div/>
          }}
        </GraphQLInfiniteScroll>
      )
    }

    // When
    const {container, debug} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent/>
      </MockedProvider>
    )

    // Then
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it("renders graphQL result without crashing", async () => {
    // Given

    const mocks = [
      {
        request: {query: mockQuery, variables},
        result: {
          data: {
            [typename]: {
              totalCount: 3,
              pageInfo: {
                endCursor: Symbol("endCursor"),
                hasNextPage: false
              },
              edges: [
                {
                  node: {id: 1}
                },
                {
                  node: {id: 2}
                },
                {
                  node: {id: 3}
                }
              ]
            }
          }
        }
      }
    ]
    const exp = [{id: 1}, {id: 2}, {id: 3}]

    function DummyComponent() {
      const queryProps = useQuery(mockQuery, {variables})
      return (
        <GraphQLInfiniteScroll typename={typename} {...queryProps}>
          {({records, total}) => {
            expect(records).toStrictEqual(exp)
            expect(total).toBe(3)
            return <div/>
          }}
        </GraphQLInfiniteScroll>
      )
    }

    // When
    const {container, debug} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent/>
      </MockedProvider>
    )
    await waitForDomChange({container})
  })

  it("renders error message without crashing when error occurred", async () => {
    // Given
    const mocks = [
      {
        request: {query: mockQuery, variables},
        error: new Error("Some Error")
      }
    ]

    // When
    const {container, debug} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent/>
      </MockedProvider>
    )
    await waitForDomChange({container})

    // Then
    expect(container).toMatchSnapshot()
  })

  it("renders nothing without crashing when query target not found", async (done) => {
    // Given
    const mocks = [
      {
        request: {query: mockQuery, variables},
        result: {
          data: {
            [typename]: undefined
          }
        }
      }
    ]

    // When
    const {container, debug} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent/>
      </MockedProvider>
    )
    try {
      await waitForDomChange({container, timeout: 0.1})
    } catch {
      // Then
      done()
      expect(container.children).toHaveLength(0)
    }

  })

  it("renders nothing without crashing if typename is wrong", async (done) => {
    // Given
    const mocks = [
      {
        request: {query: mockQuery, variables},
        result: {
          data: {
            wrongtype: {
              totalCount: 3,
              pageInfo: {
                endCursor: Symbol("endCursor"),
                hasNextPage: false
              },
              edges: [
                {
                  node: {id: 1}
                },
                {
                  node: {id: 2}
                },
                {
                  node: {id: 3}
                }
              ]
            }
          }
        }
      }
    ]

    function WrongTypenameComponent() {
      const queryProps = useQuery(mockQuery, {variables})
      return (
        <GraphQLInfiniteScroll typename={"anotherTypeName"} {...queryProps}>
          {({data}) => JSON.stringify(data)}
        </GraphQLInfiniteScroll>
      )
    }

    // When
    const {container, debug} = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <WrongTypenameComponent/>
      </MockedProvider>
    )
    try {
      await waitForDomChange({container, timeout:0.1})
    } catch {
      // Then
      done()
      expect(container.children).toHaveLength(0)
    }

  })
})

describe("graphqlConcatResultNodes", () => {
  const typename = "dummyType"

  it("concatinates prev and next graphql node data", () => {
    const prev = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: true,
          endCursor: Symbol("endCursor1")
        },
        edges: [
          {
            node: {id: 1}
          },
          {
            node: {id: 2}
          }
        ]
      }
    }
    const next = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: true,
          endCursor: Symbol("endCursor2")
        },
        edges: [
          {
            node: {id: 3}
          },
          {
            node: {id: 4}
          }
        ]
      }
    }
    const exp = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: true,
          endCursor: Symbol("endCursor2")
        },
        edges: [
          {
            node: {id: 1}
          },
          {
            node: {id: 2}
          },
          {
            node: {id: 3}
          },
          {
            node: {id: 4}
          }
        ]
      }
    }

    const res = graphqlConcatResultNodes(typename, prev, {fetchMoreResult: next})
    // INFO object同士の比較だとerrorが発生するため、serializeしておく
    expect(JSON.stringify(res)).toEqual(JSON.stringify(exp))
  })

  it("updates only pageInfo when fetchMoreResult has no edge", () => {
    const prev = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: true,
          endCursor: Symbol("endCursor1")
        },
        edges: [
          {
            node: {id: 1}
          },
          {
            node: {id: 2}
          }
        ]
      }
    }
    const next = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: false,
          endCursor: Symbol("endCursor2")
        },
        edges: []
      }
    }
    const exp = {
      [typename]: {
        totalCount: 42,
        pageInfo: {
          hasNextPage: false,
          endCursor: Symbol("endCursor2")
        },
        edges: [
          {
            node: {id: 1}
          },
          {
            node: {id: 2}
          }
        ]
      }
    }

    const res = graphqlConcatResultNodes(typename, prev, {fetchMoreResult: next})
    // INFO object同士の比較だとerrorが発生するため、serializeしておく
    expect(JSON.stringify(res)).toEqual(JSON.stringify(exp))
  })

  it("returns prev object as its original state when next is not defined", () => {
    const prev = Symbol("prev")

    const res = graphqlConcatResultNodes(typename, prev, undefined)
    expect(res).toBe(prev)
  })

  it("returns prev object as its original state when next.fetchMoreResult is not defined", () => {
    const prev = Symbol("prev")

    const res = graphqlConcatResultNodes(typename, prev, {fetchMoreResult: undefined})
    expect(res).toBe(prev)
  })
})
