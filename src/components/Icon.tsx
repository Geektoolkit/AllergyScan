import React from 'react';

export default function Icon({ name, size=16 }: { name: string; size?: number }){
  const style = { width: size, height: size, display:'inline-block', verticalAlign:'middle' } as React.CSSProperties;
  switch(name){
    case 'add':
      return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" stroke="#fff"/></svg>;
    case 'remove':
      return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" stroke="#fff"/></svg>;
    default:
      return <span style={style}></span>;
  }
}
