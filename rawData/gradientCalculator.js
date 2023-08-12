let pi = 3.1415826535898;
function f(x) {
    return (1+Math.sin((x+0.8)*pi*(1/0.3)+0.5*pi))/2;
}

function round(value, n) {
    let pow = Math.pow(10,n);
    return parseInt(value*pow)/pow;
}

let text = "-webkit-radial-gradient(circle, "

for (let x=0.4; x<0.701; x=x+0.005) {
    text+=`rgba(0,0,0,${round(f(x),3)}) ${round(x*100,1)}%, `
}
text = text.slice(0,text.length-2);
text+=")"
console.log(text)
