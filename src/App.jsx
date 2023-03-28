// import React, { useState, useEffect, useDeferredValue } from 'react'

// const App = () => {
//   const [list, setList] = useState([])
//   useEffect(() => {
//     setList(new Array(10000).fill(null))
//   }, [])
//   // 使用了并发特性，开启并发更新
//   const deferredList = useDeferredValue(list)

//   return (
//     <>
//       {deferredList.map((_, i) => (
//         <div key={i}>{i}</div>
//       ))}
//     </>
//   )
// }

// export default App
import React, { useState, useReducer } from 'react'

const third = (x) => x

export default function App() {
  const [first, setFirst] = useState(0)
  const [second, setSecond] = useReducer((x) => x, 0, third)

  console.log('render') //sy-log

  return (
    <div className="App">
      <button onClick={() => setFirst(0)}>first{first}</button>
      <button onClick={() => setSecond(0)}>first{second}</button>
    </div>
  )
}
