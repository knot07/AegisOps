import React from 'react';
export default function Page(){return <iframe title="威胁情报工作台" src={'/api/scenes/vulnops/intelligence'+location.search} style={{display:'block',width:'100%',height:'calc(100dvh - 16px)',border:0,background:'transparent'}}/>;}
