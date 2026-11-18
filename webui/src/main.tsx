import './i18n'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import WorkspaceActionTheme from './components/common/WorkspaceActionTheme'
import './styles/index.css'
import './styles/yushu.css'
import './styles/module-polish.css'
import './styles/action-theme.css'
import './styles/calendar-theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <WorkspaceActionTheme />
  </React.StrictMode>,
)
