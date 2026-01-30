import Login from '../pages/Login/index';
import Home from '../pages/Home/index';
import DeviceBinding from '../pages/DeviceBinding/index';

export interface RouteConfig {
  path: string;
  title: string;
  Component: React.ComponentType;
}

export const routes: RouteConfig[] = [
  {
    path: '/login',
    title: '一体机登录',
    Component: Login,
  },
  {
    path: '/home',
    title: '首页',
    Component: Home,
  },
  {
    path: '/device-binding',
    title: '设备绑定',
    Component: DeviceBinding,
  },
];

export const getTitleByPath = (path: string): string => {
  const route = routes.find(r => r.path === path);
  return route ? route.title : '首页';
};
