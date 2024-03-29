import React from 'react'
import ReactDOM from 'react-dom'
import { identity } from '@drewxiu/utils'

export interface BoundingClientRect {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
}

interface Config {
  debounceFunc: (func: () => void) => () => void
  delay: number
}

const defaultConfig = {
  debounceFunc: identity,
  delay: 1000,
}

type WithClientRect<P> = P & { clientRect: BoundingClientRect }

function hocWithConfig<P>(Component: React.ComponentClass<P> | React.SFC<P>, config: Config) {
  class Composed extends React.Component<WithClientRect<P>> {
    static displayName = `withBoundingRect<${Component.displayName || Component.name || 'Unknown'}>`
    state: BoundingClientRect = {
      width: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    }

    calcRect = config.debounceFunc(() => {
      let node: Element = ReactDOM.findDOMNode(this) as Element

      // ! to get correct client rect, have to remove all children
      // then append them back after the calculation !
      let children: any[] = []
      while (node.firstChild) {
        children.push(node.removeChild(node.firstChild!))
      }
      setTimeout(() => {
        const rect = node.getBoundingClientRect()
        children.forEach(e => node.appendChild(e))

        this.setState({
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        })
      }, config.delay)
    })

    componentDidMount() {
      setTimeout(() => this.calcRect())
      window.addEventListener('resize', this.calcRect)
      window.addEventListener('resize-custom', this.calcRect)
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.calcRect)
      window.removeEventListener('resize-custom', this.calcRect)
    }

    render() {
      return <Component {...this.props} clientRect={{ ...this.state }} />
    }
  }

  return Composed as React.ComponentClass<WithClientRect<P>>
}

export function withBoundingRect(config: Partial<Config> = {}) {
  return Component => hocWithConfig(Component, Object.assign({}, defaultConfig, config))
}
