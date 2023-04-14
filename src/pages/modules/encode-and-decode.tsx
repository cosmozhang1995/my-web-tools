import Image from 'next/image'
import { Inter } from 'next/font/google'
import { Layout } from 'antd'
import { Menu, MenuProps } from 'antd'
import { useRouter } from 'next/router'
import { useState, Dispatch, SetStateAction } from 'react'
import { useRef } from 'react'
import { Form, Input, Button, Space, Dropdown, InputRef } from 'antd'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { DoubleLeftOutlined, DoubleRightOutlined, DownOutlined } from '@ant-design/icons'
import styles from '@/styles/modules/encode-and-decode.module.css'
import { array_to_map } from '@/utils/collections'

const { Header, Sider, Content } = Layout;

const inter = Inter({ subsets: ['latin'] })

let f = (a: string) => parseInt(a)

interface CodingDef {
  key: string
  label: string
  decode: (src: string) => string
  encode: (src: string) => string
}

const AllCodingDefs: CodingDef[] = [
  {
    key: 'text',
    label: '字符串',
    decode: (src) => src,
    encode: (src) => src,
  },
  {
    key: 'ascii',
    label: 'ASCII码',
    decode: (encoded) => {
      let decoded = ''
      const CODE_TABLE = '0123456789ABCDEF'
      encoded = encoded.replace(/0x([0-9a-fA-F]{1,2})/g, (m0, m1) => m1)
      encoded = encoded.replace(/\\x([0-9a-fA-F]{1,2})/g, (m0, m1) => m1)
      encoded = encoded.trim()
      let encode_array: string[] = []
      if (encoded.indexOf(' ') >= 0) {
        encode_array = encoded.split(/\s+/);
      } else {
        if (encoded.length % 2 != 0) {
          throw 'illegal encoding'
        }
        for (var i = 0; i < encoded.length; i += 2) {
          encode_array.push(encoded.substr(i, 2));
        }
      }
      for (var ascii_str of encode_array) {
        var ascii = 0;
        for (var ch of ascii_str) {
          var idx = CODE_TABLE.indexOf(ch);
          if (idx < 0) {
            throw 'illegal encoding'
          }
          ascii = ascii * 16 + idx;
        }
        decoded += String.fromCharCode(ascii);
      }
      return decoded;
    },
    encode: (decoded) => {
      let encoded = [];
      const CODE_TABLE = '0123456789ABCDEF';
      for (let ch of decoded) {
        let ascii = ch.charCodeAt(0);
        if (ascii > 255) {
          throw 'illegal text for codes ASCII'
        }
        encoded.push(CODE_TABLE[Math.floor(ascii / 16)] + CODE_TABLE[ascii % 16]);
      }
      return encoded.join(' ');
    },
  },
]

const CodingDefMap = array_to_map(AllCodingDefs, d => d.key, d => d)

const CodingMenuItems: MenuProps['items'] = AllCodingDefs.map(d => {
  return { key: d.key, label: d.label}
})

function makeCodingDropdown(
    value: string,
    setter: (val: string) => any
  ) {
  return (
    <Form>
      <Dropdown
        menu={{
          items:CodingMenuItems,
          onClick: (info) => setter(info.key)
        }}
        trigger={['click']}>
        <Button style={{width: 100}}>
          <Space>
            {CodingDefMap[value].label}
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
    </Form>
  )
}

function makeInputArea(
  value: string,
  isValid: boolean,
  height: number|string,
  onResize: (height: number | string) => any,
  setRef: (input: TextAreaRef | null) => any,
  onChange: (value: string) => any
) {
  return (
    <Input.TextArea
      style={{
        height: height,
        minHeight: 200
      }}
      value={value}
      onResize={(size) => onResize(size.height)}
      status={isValid ? '' : 'error'}
      ref={setRef}
      onChange={(event) => onChange(event.target.value)}
      >
    </Input.TextArea>
  )
}

function convert(
  srcCodingGetter: () => string,
  dstCodingGetter: () => string,
  srcValueGetter: () => string,
  dstValueSetter: (value: string) => any,
  setValid: (invalid: boolean) => any,
) {
  const srcCoding = srcCodingGetter()
  const dstCoding = dstCodingGetter()
  let value = srcValueGetter()
  try {
    value = CodingDefMap[srcCoding].decode(value)
    value = CodingDefMap[dstCoding].encode(value)
    dstValueSetter(value)
    setValid(true)
  } catch (e) {
    setValid(false)
  }
}

export default function Home() {

  const [typeLeft, setTypeLeft] = useState('text');
  const [typeRight, setTypeRight] = useState('ascii');
  const getTypeLeft = () => typeLeft
  const getTypeRight = () => typeRight

  const [valueLeft, setValueLeft] = useState('');
  const [valueRight, setValueRight] = useState('');
  const getLeftValue = () => valueLeft
  const getRightValue = () => valueRight

  const [leftHeight, setLeftHeight] = useState<number|string>(200)
  const [rightHeight, setRightHeight] = useState<number|string>(200)

  const [leftValid, setLeftValid] = useState(true)
  const [rightValid, setRightValid] = useState(true)

  let leftInput: TextAreaRef | null
  let rightInput: TextAreaRef | null
  const setLeftInput = (input: TextAreaRef | null) => leftInput = input
  const setRightInput = (input: TextAreaRef | null) => rightInput = input
  const leftInputProvider = () => leftInput
  const rightInputProvider = () => rightInput

  return (
    <div>
      <div className={styles.main_wrapper} style={{height: 30}}>
        <div className={styles.text_area_wrapper}>
          {makeCodingDropdown(typeLeft, setTypeLeft)}
        </div>
        <div className={styles.center_button_column}>
        </div>
        <div className={styles.text_area_wrapper}>
          {makeCodingDropdown(typeRight, setTypeRight)}
        </div>
    </div>
    <div className={styles.main_wrapper} style={{paddingTop:10}}>
        <div className={styles.text_area_wrapper}>
          {makeInputArea(valueLeft, leftValid, leftHeight,
            (height) => {
              setLeftHeight(height)
              setRightHeight(height)
            },
            setLeftInput,
            setValueLeft)}
        </div>
        <div className={styles.center_button_column}>
            <Space direction='vertical' style={{width: '100%'}}>
                <Button
                  className={styles.center_button}
                  style={{width: '100%'}}
                  icon={<DoubleRightOutlined/>}
                  onClick={() => convert(
                    getTypeLeft,
                    getTypeRight,
                    getLeftValue,
                    setValueRight,
                    setLeftValid,
                  )}
                  >
                </Button>
                <Button
                  className={styles.center_button}
                  style={{width: '100%'}}
                  icon={<DoubleLeftOutlined/>}
                  onClick={() => convert(
                    getTypeRight,
                    getTypeLeft,
                    getRightValue,
                    setValueLeft,
                    setRightValid,
                  )}
                  >
                </Button>
            </Space>
        </div>
        <div className={styles.text_area_wrapper}>
          {makeInputArea(valueRight, rightValid, rightHeight,
            (height) => {
              setLeftHeight(height)
              setRightHeight(height)
            },
            setRightInput,
            setValueRight)}
        </div>
      </div>
    </div>
  )
}
