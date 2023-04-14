import Image from 'next/image'
import { Inter } from 'next/font/google'
import { Layout as AntLayout } from 'antd'
import { Menu, MenuProps, Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styles from '@/styles/_layout.module.css'

const { Header, Sider, Content } = AntLayout;

const inter = Inter({ subsets: ['latin'] })

export interface LayoutProps {
  children?: any;
  module?: string;
}

interface MenuEntry {
  key: string
  label: string
  url: string
}

const menuEntries: MenuEntry[] = [
  {
    key: 'encode-and-decode',
    label: '编码转换',
    url: '/modules/encode-and-decode'
  }
]

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()

  const [menuSelection, setMenuSelection] = useState()

  const menuItems: MenuProps['items'] = menuEntries.map(entry => {
    return { key: entry.key, label: entry.label }
  })

  const menuOnClick: MenuProps['onClick'] = (info) => {
    for (let entry of menuEntries) {
      if (entry.key == info.key) {
        router.push(entry.url)
        break
      }
    }
  }

  const currentModule = menuEntries.find(entry => entry.url == router.asPath)?.key

  return (
    <AntLayout>
      <Header style={{backgroundColor: '#efefef', borderBottom: '#cccccc 1px solid'}}>
        <span
          className={styles.header_home_button}
          onClick={() => {
            router.push('/')
          }}>
          小组件们
        </span>
      </Header>
      <AntLayout>
        <Sider>
          <Menu
            onClick={menuOnClick}
            defaultSelectedKeys={[]}
            selectedKeys={currentModule ? [currentModule] : []}
            items={menuItems}
            style={{height:'100%'}}
          />
        </Sider>
        <Content style={{backgroundColor: 'white'}}>
            {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
