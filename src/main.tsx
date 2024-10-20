import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import Launch from './launch'
import Mint from './mint'

const App = (): React.JSX.Element => {
  return (
    <ChakraProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Launch />} />
          <Route path="/:address" element={<Mint />} />
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
