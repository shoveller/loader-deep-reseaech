import {LoaderFunction, Outlet, redirect} from "react-router";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url)
  if (url.pathname === '/') {
      return redirect('/depth1/depth2')
  }

  return null
}

const A = () => {
  return <Outlet />
}

export const Component = A;
export default A
