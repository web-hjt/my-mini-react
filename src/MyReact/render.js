// 下一任务单元
let nextUnitOfWork = null
//work in progress root
let wipRoot = null
//上次提交到 DOM 节点的 fiber 树 老的fiber
let currentRoot = null
// 要删除的fiber
let deletions = []
let wipFiber = null
let hookIndex = 0
// diff阶段
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let prevSibling = null
  // 旧的数据
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  while (index < elements.length || !!oldFiber) {
    // 新的数据
    const childrenElement = elements[index]
    let newFiber = null

    // type 是否相同
    const sameType =
      oldFiber && childrenElement && childrenElement.type === oldFiber.type
    // type 相同 更新
    // 当新的 element 和旧的 fiber 类型相同, 我们对 element 创建新的 fiber 节点，并且复用旧的 DOM 节点，但是使用 element 上的 props。
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        parent: wipFiber,
        props: childrenElement.props,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    // type 不同 并且存在新节点 新建
    if (!sameType && childrenElement) {
      newFiber = {
        type: childrenElement.type,
        parent: wipFiber,
        props: childrenElement.props,
        dom: null,
        alternate: oldFiber,
        effectTag: 'PLACEMENT',
      }
    }
    // 删除操作
    if (!sameType && oldFiber) {
      oldFiber.effectTag = 'DELETE'
      deletions.push(oldFiber)
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
}
export function useState(initial) {
  const oldHook = wipFiber?.alternate?.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }
  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    const isFunctionComponent = action instanceof Function
    if (isFunctionComponent) {
      hook.state = action(hook.state)
    } else {
      hook.state = action
    }
  })
  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }
  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
  // wipFiber.alternate.hooks
}
// 函数组件
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}
// 非函数组件处理
function updateHostComponent(fiber) {
  // reactElement 转化成一个真实dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}
// 把 element 添加到 DOM 上
// 为该 fiber 节点的子节点新建 fiber
// 需要执行每一小块的任务单元，还需要返回下一个任务单元。
function performUnitOfWork(fiber) {
  // 执行任务单元
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }
  // 为当前的fiber创造他子节点的fiber
  // new fiber === parent / sibling
  // parent child sibling
  // const elements = fiber?.props?.children
  // reconcileChildren(fiber, elements)
  // return 下一个任务单元
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return
}
// 删除
function commitDeletion(fiber, domParent) {
  if (fiber?.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber?.child, domParent)
  }
}
// 做渲染真实dom 操作
function commitWork(fiber) {
  if (!fiber) return
  // const domParent = fiber.parent.dom
  // domParent.appendChild(fiber.dom)
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom
  switch (fiber.effectTag) {
    case 'PLACEMENT':
      !!fiber.dom && domParent.appendChild(fiber.dom)
      break
    case 'UPDATE':
      !!fiber.dom && updateDom(fiber.dom, fiber.alternate, fiber.props)
      break
    case 'DELETE':
      // !!fiber.dom && domParent.removeChild(fiber.dom)
      commitDeletion(fiber, domParent)
      break
    default:
      break
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

// 筛选出来事件
const isEvent = (key) => key?.startsWith('on')
// 筛选出children属性
const isProperty = (key) => key !== 'children' && !isEvent(key)
// 筛选出要移除属性
const isGone = (prev, next) => (key) => !(key in next)
// 筛选出新的属性
const isNew = (prev, next) => (key) => prev[key] !== next[key]

// 更新dom
function updateDom(dom, prevProps, nextProps) {
  // 移除掉旧的监听事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // // 移除掉不存在新props的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => (dom[name] = ''))

  // 新增属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => (dom[name] = nextProps[name]))

  // 新增事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function commitRoot() {
  commitWork(wipRoot.child)
  // 删除需要删除的节点
  deletions.forEach(commitWork)
  currentRoot = wipRoot
  wipRoot = null
}

function workLoop(deadline) {
  let shouldYield = true
  // 等浏览器空闲执行
  while (nextUnitOfWork && shouldYield) {
    // debugger
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    // deadline.timeRemaining() //得到浏览器当前帧剩余时间
    shouldYield = deadline.timeRemaining() < 1
    // debugger
  }
  // 所有都挂载完了再渲染到页面
  if (!nextUnitOfWork && wipRoot) {
    // debugger
    commitRoot()
  }

  requestIdleCallback(workLoop)
}
// 还给了我们一个 deadline 参数。我们可以通过它来判断离浏览器再次拿回控制权还有多少时间。
// 传一个回调函数，他会在下一帧还有时间的时候去执行对应的回调
requestIdleCallback(workLoop)
// 创建真实dom
function createDom(fiber) {
  const dom =
    fiber.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)
  return dom
}
export function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, //存fiber
  }
  nextUnitOfWork = wipRoot
  deletions = []
}
