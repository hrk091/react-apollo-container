import React from "react"
import { MockedProvider } from "@apollo/react-testing"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/extend-expect"

import { useQuery } from "@apollo/react-hooks"
import gql from "graphql-tag"

import GraphQLContainer from "../GraphQLContainer"
import { waitForDomChange } from "@testing-library/dom"

describe("GraphQLContainer", () => {
  // Setup

  const mockQuery = gql`
    query Contact($id: ID!) {
      contact(id: $id) {
        name
      }
    }
  `
  const variables = {
    id: "dummyId"
  }
  const typename = "contact"
  const data = { name: "dummyName" }

  function DummyComponent() {
    const queryProps = useQuery(mockQuery, { variables })
    return (
      <GraphQLContainer typename={typename} {...queryProps}>
        {({ data }) => JSON.stringify(data)}
      </GraphQLContainer>
    )
  }

  // Tests

  it("renders loading state initially", () => {
    // Given
    const mocks = [
      {
        request: { query: mockQuery, variables },
        result: {
          data: {
            [typename]: data
          }
        }
      }
    ]
    const spy = jest.fn()
    function DummyComponent() {
      const queryProps = useQuery(mockQuery, { variables })
      return (
        <GraphQLContainer typename={typename} {...queryProps}>
          {({ data }) => {
            spy()
            return <div />
          }}
        </GraphQLContainer>
      )
    }

    // When
    const { container, debug } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent />
      </MockedProvider>
    )

    // Then
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it("renders graphQL result without crashing", async () => {
    // Given
    const mocks = [
      {
        request: { query: mockQuery, variables },
        result: {
          data: {
            [typename]: data
          }
        }
      }
    ]
    function DummyComponent() {
      const queryProps = useQuery(mockQuery, { variables })
      return (
        <GraphQLContainer typename={typename} {...queryProps}>
          {({ data }) => JSON.stringify(data)}
        </GraphQLContainer>
      )
    }

    // When
    const { container, debug } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent />
      </MockedProvider>
    )
    await waitForDomChange({ container })

    // Then
    expect(container).toHaveTextContent(JSON.stringify(data))
  })

  it("renders error message without crashing when error occurred without crashing", async () => {
    // Given
    const mocks = [
      {
        request: { query: mockQuery, variables },
        error: new Error("Some Error")
      }
    ]

    // When
    const { container, debug } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent />
      </MockedProvider>
    )
    await waitForDomChange({ container })

    // Then
    expect(container).toMatchSnapshot()
  })

  it("renders message 'No Data' without crashing when query target not found", async () => {
    // Given
    const mocks = [
      {
        request: { query: mockQuery, variables },
        result: {
          data: {
            [typename]: undefined
          }
        }
      }
    ]

    // When
    const { container, debug } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DummyComponent />
      </MockedProvider>
    )
    await waitForDomChange({ container })

    // Then
    expect(container).toMatchSnapshot()
  })

  it("renders message 'No Data' without crashing if typename is wrong", async () => {
    // Given
    const mocks = [
      {
        request: { query: mockQuery, variables },
        result: {
          data: {
            [typename]: data
          }
        }
      }
    ]

    function WrongTypenameComponent() {
      const queryProps = useQuery(mockQuery, { variables })
      return (
        <GraphQLContainer typename={"anotherTypeName"} {...queryProps}>
          {({ data }) => JSON.stringify(data)}
        </GraphQLContainer>
      )
    }

    // When
    const { container, debug } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <WrongTypenameComponent />
      </MockedProvider>
    )
    await waitForDomChange({ container })

    // Then
    expect(container).toMatchSnapshot()
  })
})
