import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router";

const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/" hydrateFallbackElement={<h1>로딩중</h1>} lazy={() => import('./A.tsx')}>
        <Route path="depth1" lazy={() => import('./B.tsx')}>
            <Route path="depth2" lazy={() => import('./C.tsx')} />
        </Route>
    </Route>
))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
