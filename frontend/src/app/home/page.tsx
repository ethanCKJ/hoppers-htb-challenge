import HeadBar from '@/components/HeadBar'
import React from 'react'

const Home = () => {
  return (
    <div>
        <HeadBar />
        <h1 className="text-3xl font-bold underline self-center mt-20">
          Hello, Next.js! This is the Home Page.
        </h1>
    </div>
  )
}

export default Home