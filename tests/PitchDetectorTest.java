package cn.sonora.music;
import java.util.Random;
public class PitchDetectorTest {
 static final int RATE=22050,N=2048;
 static short[] signal(double f,double amp,double detune,boolean harmonic){
  short[] s=new short[N];for(int i=0;i<N;i++){
   double t=i/(double)RATE;
   double v=Math.sin(2*Math.PI*f*Math.pow(2,detune/1200)*t);
   if(harmonic)v=.45*v+.32*Math.sin(4*Math.PI*f*t)+.18*Math.sin(6*Math.PI*f*t);
   s[i]=(short)(amp*32767*v);
  }return s;
 }
 static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 public static void main(String[] args){
  int checks=0;PitchDetector d=new PitchDetector(RATE,N);
  for(double f:new double[]{65.4,82.4,130.81,220,261.6256,440,659.255,880,1046.5}){
   for(boolean harmonic:new boolean[]{false,true}){
    double result=d.detect(signal(f,.32,0,harmonic));
    double cents=1200*Math.log(result/f)/Math.log(2);
    check(result>0&&Math.abs(cents)<8,"pitch "+f+" result "+result+" cents "+cents);checks++;
   }
  }
  for(double cents:new double[]{-50,-25,25,50}){
   double result=d.detect(signal(440,.25,cents,false));double actual=1200*Math.log(result/440)/Math.log(2);
   check(Math.abs(actual-cents)<5,"detune "+cents+" got "+actual);checks++;
  }
  check(d.detect(new short[N])<0,"silence");checks++;
  check(d.detect(signal(440,.002,0,false))<0,"quiet signal");checks++;
  short[] dc=new short[N];java.util.Arrays.fill(dc,(short)1000);check(d.detect(dc)<0,"DC");checks++;
  Random r=new Random(31415);for(int k=0;k<10;k++){short[] noise=new short[N];for(int i=0;i<N;i++)noise[i]=(short)(r.nextGaussian()*3000);check(d.detect(noise)<0,"noise "+k);checks++;}
  System.out.println("PASS: "+checks+" signal checks (pure, harmonics, detune, silence, quiet, DC, noise)");
 }
}
