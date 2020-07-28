// @flow

import { useQuery } from "@apollo/react-hooks"
import { Input, Label, InputGroup } from "reactstrap"
import React from "react"

type Props = {
  label: string,
  query: any,
  variables: { [string]: any },
  requiredVariables: Array<string>,
  typename: string,
  value: string,
  accessors: {
    key: ({ [string]: mixed }) => mixed,
    value: ({ [string]: mixed }) => any,
    repr: ({ [string]: any }) => any
  },
  handleChange: (string, any) => void
}

function InnerGraphQLSelector(props: Props) {
  const { label, query, variables, typename, accessors, handleChange } = props

  const { data, loading, error } = useQuery(query, { variables: variables || {} })
  if (loading) {
    return <div className="spinner-border spinner-border-sm mt-sm-1" role="status" />
  }
  if (error) {
    console.error(error)
    return <span>{error.message}</span>
  }
  if (!data || !data[typename]) {
    return <div />
  }
  if (data[typename].totalCount === 0) {
    return <span>対象が見つかりませんでした。</span>
  }

  const nodes = data[typename].edges
  let options = null
  try {
    options = nodes.map(({ node }) => {
      const key = accessors.key(node)
      const value = accessors.value(node)
      const repr = accessors.repr(node)
      if (!key) {
        throw new Error(`Rendering options failed. 'key' cannot be resolved from: ${JSON.stringify(node)}`)
      }
      if (!value) {
        throw new Error(`Rendering options failed. 'value' cannot be resolved from: ${JSON.stringify(node)}`)
      }
      if (!key) {
        throw new Error(`Rendering options failed. 'repr' cannot be resolved from: ${JSON.stringify(node)}`)
      }
      return { key, value, repr }
    })
  } catch (err) {
    console.error(err)
    return <span>{err.message}</span>
  }

  const onChange = ev => {
    const value = ev.target.value
    if (value) {
      const { node } = nodes.find(({ node }) => accessors.value(node).toString() === value)
      handleChange(value, node)
    } else {
      handleChange("", null)
    }
  }

  return (
    <>
      <Label>{label}</Label>
      <InputGroup>
        <Input type="select" value={props.value} onChange={onChange}>
          <option key="nodata" value="">
            --------
          </option>
          {options.map(({ key, value, repr }) => (
            <option key={key} value={value}>
              {repr}
            </option>
          ))}
        </Input>
      </InputGroup>
    </>
  )
}

function GraphQLSelector(props: Props) {
  const { variables, requiredVariables } = props

  if (!requiredVariables.every(key => variables[key])) {
    return <div />
  }
  return (
    <div className="mb-3">
      <InnerGraphQLSelector {...props} />
    </div>
  )
}

GraphQLSelector.defaultProps = {
  variables: {},
  requiredVariables: []
}

export default GraphQLSelector
