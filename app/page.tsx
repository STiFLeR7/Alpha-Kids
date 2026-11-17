'use client';
import {Layout,LayoutContent,VStack} from '@astryxdesign/core/Layout';
import {Heading,Text} from '@astryxdesign/core/Text';
import {getUiCopy} from '../lib/copy';
export default function Page(){const copy=getUiCopy('en');return <Layout contentWidth={720} padding={6} content={<LayoutContent><VStack gap={8}><Heading level={1}>{copy.appTitle}</Heading><Text>{copy.prototype}</Text><Heading level={2}>{copy.welcome}</Heading><Text>{copy.introduction}</Text></VStack></LayoutContent>}/>}
