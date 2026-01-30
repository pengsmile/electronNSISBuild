import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import TitleBar from './components/TitleBar'
import Footer from './components/Footer'
import { routes } from './router'
import './App.css'

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <TitleBar />
        <div className="main-content">
          <Routes>
            {routes.map((route) => {
              const { Component, path } = route;
              return (
                <Route 
                  key={path} 
                  path={path} 
                  element={<Component />} 
                />
              );
            })}
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </HashRouter>
  )
}

export default App
