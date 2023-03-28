// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import './index.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )
/**@jsxRuntime classic */
import { jsx } from 'react'
import MyReact from './MyReact'

// const element = MyReact.createElement(
//   'div',
//   {
//     title: 'hello',
//     id: 'hjt',
//   },
//   'hhhhh',

//   MyReact.createElement('a', null, '我是a标签')
// )
// // console.log('element', element)
// let container = document.getElementById('root')
// MyReact.render(element, container)

/** @jsx MyReact.createElement */
const container = document.getElementById('root')
function Counter() {
  const [state, setState] = MyReact.useState(1)
  return (
    <h1 onClick={() => setState(state + 1)} style="user-select: none">
      Count: {state}
    </h1>
  )
}
// const updateValue = (e) => {
//   rerender(e.target.value)
// }

// const rerender = (value) => {
//   const element = (
//     <div>
//       {/* <input onInput={updateValue} value={value} />
//       <h2>Hello {value}</h2> */}
//       <Counter />
//     </div>
//   )
//   MyReact.render(element, container)
// }

// rerender('World')
MyReact.render(<Counter />, container)
