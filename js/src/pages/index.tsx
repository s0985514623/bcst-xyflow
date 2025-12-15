import { useState } from 'react'
import reactLogo from '../assets/images/react.svg'
import viteLogo from '../assets/images/vite.svg'
import wpLogo from '../assets/images/wp.png'
import GetRestPostsPage from './GetRestPosts'
import Flow from './Flow'

function DefaultPage() {
  const [
    count,
    setCount,
  ] = useState(0)
  const [
    showRestPosts,
    setShowRestPosts,
  ] = useState(false)

  return (
    <div className="App py-20">
      <Flow />
    </div>
  )
}

export default DefaultPage
