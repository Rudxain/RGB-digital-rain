"use strict";!function(){var l,n,r,o,t,e,M=Math,a=document,i=requestAnimationFrame,f=a.getElementById("c"),d=f.getContext("2d",{alpha:!1,desynchronized:!0}),h=["f00","ff0","0f0","0ff","00f","f0f"],s=[],c=(t,e)=>M.random()*(e-t)+ +t,g=0,m=()=>{l=f.width=a.body.offsetWidth,n=f.height=a.body.offsetHeight;for(var t=M.ceil(l/32);t>s.length;)s.push(0);s.length=t},u=()=>{d.fillStyle="#"+h[g++],d.font="bold 32px monospace",g%=6;for(var t=0,e=0;t<s.length;t++,e+=32){var a=s[t];d.fillText("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"[0|c(0,94)],e,a),s[t]=a>c(64,16384)>>>0?0:a+32}},v=t=>{var e,a,f;o&&(e=t-r,(e=M.round((a=0,(f=255)<(e=e)?f:e<a?a:e)))&&(d.fillStyle="#000000"+e.toString(16).padStart(2,"0"),d.fillRect(0,0,l,n),r=t),i(v))};m(),i(t=>{u(),r=t}),(o=!o)?(t=setInterval(u,100/3),i(v)):clearInterval(t),addEventListener("resize",()=>{clearTimeout(e),e=setTimeout(m,1500)})}()