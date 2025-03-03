import {Await, data, useLoaderData} from "react-router";
import {Suspense} from "react";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const criticalAPi = async () => {
  await sleep(1000);

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
