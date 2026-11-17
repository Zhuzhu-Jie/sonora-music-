package cn.sonora.music;

/** YIN difference function with cumulative normalization and parabolic refinement. */
public final class PitchDetector {
    private final int rate;
    private final double[] diff;
    public double confidence, rms;
    public PitchDetector(int rate, int size) { this.rate = rate; this.diff = new double[size / 2]; }
    /** Average adjacent hardware samples: 44100 Hz -> 22050 Hz analysis frames. */
    public static void prepareFrame(short[] hardware, short[] analysis) {
        if (hardware.length != analysis.length * 2) throw new IllegalArgumentException("frame size");
        for (int i=0; i<analysis.length; i++) analysis[i]=(short)(((int)hardware[i*2]+hardware[i*2+1])/2);
    }
    public double detect(short[] input) {
        int half = Math.min(diff.length, input.length / 2);
        double mean = 0, energy = 0;
        for (short v : input) mean += v;
        mean /= input.length;
        for (short v : input) energy += (v - mean) * (v - mean);
        rms = Math.sqrt(energy / input.length) / 32768.0;
        confidence = 0;
        if (rms < 0.008) return -1;
        diff[0] = 1;
        double sum = 0;
        int minLag = Math.max(2, rate / 1100), maxLag = Math.min(half - 2, rate / 65);
        for (int tau = 1; tau <= maxLag + 1; tau++) {
            double d = 0;
            for (int j = 0; j < half; j++) { double delta = input[j] - input[j + tau]; d += delta * delta; }
            sum += d;
            diff[tau] = sum == 0 ? 1 : d * tau / sum;
        }
        int tau = minLag;
        while (tau <= maxLag) {
            if (diff[tau] < 0.15) {
                while (tau < maxLag && diff[tau + 1] < diff[tau]) tau++;
                confidence = Math.max(0, 1 - diff[tau]);
                double a = diff[tau - 1], b = diff[tau], c = diff[tau + 1];
                double denom = 2 * (2 * b - c - a);
                double refined = tau + (Math.abs(denom) < 1e-9 ? 0 : (c - a) / denom);
                return rate / refined;
            }
            tau++;
        }
        return -1;
    }
}
