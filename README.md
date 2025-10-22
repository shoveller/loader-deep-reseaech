# react router 의 loader , HydrateFallback, Await  사용법

## `loader` 의 라우팅 기능
- react router 의 `loader` 는 패치한 서버사이드 데이터에 따라 라우팅을 제어한다
- 라우팅을 제어하는 기능만큼은 그 어떤 라이브러리도 따라올 수 없다.
    - loader 를 사용하지 않는 라우팅 트랩은 이렇게 만든다.
```diff
const router = createBrowserRouter(createRoutesFromElements(  
    <Route path="/" lazy={() => import('./A.tsx')}>  
        <Route path="depth1" lazy={() => import('./B.tsx')}>  
            <Route path="depth2" lazy={() => import('./C.tsx')} />  
        </Route>        
+		<Route index element={<Navigate to="/depth1/depth2" replace />} />  
    </Route>
))
```

- 위의 코드는 `A.tsx` 에 `loader` 구현으로 대체할 수 있다.
    - 프레임워크 모드와 라이브러리 모드 양쪽에서 같은 결과를 얻을 수 있으므로 추천하는 조합이다.
    - 이 문서에서는 `loader` 의 데이터 로드 기능에 집중한다.
```tsx
import { LoaderFunction, redirect } from "react-router";  
  
export const loader: LoaderFunction = ({ request }) => {  
  const url = new URL(request.url)  
  if (url.pathname === '/') {  
      return redirect('/depth1/depth2')  
  }  
  
  return null  
}
```

## `loader` 의 데이터 로드 기능과 `HydrateFallback` 의 한계
- `loader` 는 데이터를 패치하는 동안 UI 렌더링을 멈춘다.
- `loader` 가 불러온 데이터를 클라이언트가 소비하는 순간 서버사이드의 데이터를 기반으로 서버사이드에서 컴포넌트가 렌더링된다.
    - 따라서 이 기간은 하이드레이션 기간이 되며 `HydrateFallback` 이 대체 UI로 표시된다.
        - 이 `HydrateFallback` 은 모든 라우트 모듈에 지정할 수 있다.
        - 하지만 결국 렌더링되는건 최상위 라우트모듈의 `HydrateFallback` 이다.
        - 이것은 중첩 레이아웃 기능을 사용하지 않아도 똑같이 적용된다
        - **`HydrateFallback` 은 범용 하이드레이션 UI로만 사용해야 한다.**
        - **loader 는 필수 데이터를 읽어들여 라우팅하는 용도로만 사용해서 UI 렌더링을 막지 않아야 한다**

## 로딩시간이 긴 데이터를 서버에서 스트리밍하려면
- 공식 홈페이지의 [Streaming with Suspense](https://reactrouter.com/how-to/suspense) 의 레시피에 따르면 로더에서 프로미스를 반환하면 스트리밍이 된다고 한다.
- 로더는 UI를 블록한다. 필수 데이터는 빨리 패치해서 내보내고, 그렇지 않은 데이터는 pending 상태의 프로미스를 반환하라는 것
    - **loader 함수가 async 여도 동작하지 않는다. 실행중인 promise 를 반환하는 것이 포인트다.**
    - 페이지가 렌더링되는 중에도 promise 내부는 실행중이므로 렌더링 시간을 절약할 수 있다.
```tsx
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));  
  
const criticalAPi = async () => {  
  await sleep(150);  
  
  return 'critical data'  
}  
  
const nonCriticalAPi = async () => {  
  await sleep(5000);  
  
  return 'non critical data'  
}  
  
export const loader = async () => {  
  // 필수 데이터는 대기하고 보낸다  
  const critical = await criticalAPi();  
  // 필수 데이터가 아니거나 시간이 오래 걸리는 데이터는 promise 형태로 보낸다.  
  const nonCritical = nonCriticalAPi();  
  
  return data({ critical, nonCritical })  
}
```

## `<Await />` 으로 비동기 데이터 렌더링
- `loader` 가 비동기 데이터를 반환힐때 `<Await />` 이 활약한다.
    - 이 컴포넌트는 promise 가 `fullfilled` 상태가 될 때까지 기다리고 `<Supsense />` 에 대체 UI 렌더링을 위임한다.
    - react 19 의 use 를 대신 사용할 수 있지만, promise 를 throw 할 래퍼를 만들어야 하기 때문에 `<Await />` 을 사용하는게 더 좋다.
```tsx
const C = () => {  
  const loaderData = useLoaderData<{ critical: string, nonCritical: Promise<string> }>();  
  
  return (  
      <>  
        <h1>{loaderData.critical}</h1>  
        <Suspense fallback={<h1>중요하지 않은 데이터를 기다리는 중</h1>}>  
          <Await resolve={loaderData.nonCritical}>  
            {(res) => <h1>{res}</h1>}  
          </Await>  
        </Suspense>      
	  </>  
  )  
}  
  
export const Component = C;  
export default C
```

- 놀랍게도 위 코드를 실행하면 html 이 스트리밍 된다.
    - 정확히는 html 속 json 이 시간 간격을 두고 업데이트 된다.
    - 실제로 보면 로딩 기간이 아주 긴 html로 보인다.
    - 일정 시간이 지나면 loader 에서 반환한 데이터가 스트리밍 되는 것을 확인할 수 있다.
