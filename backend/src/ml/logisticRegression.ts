export interface LRWeights {
  w: number[];
  b: number;
  dim: number;
}

export interface TrainOptions {
  epochs: number;
  learningRate: number;
  l2: number;
  onEpoch?: (epoch: number, accuracy: number, loss: number) => void;
}

const DEFAULT_OPTIONS: TrainOptions = {
  epochs: 300,
  learningRate: 0.5,
  l2: 0.001,
};

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function predictProba(x: number[], weights: LRWeights): number {
  let z = weights.b;
  for (let i = 0; i < weights.dim; i++) {
    z += weights.w[i] * x[i];
  }
  return sigmoid(z);
}

export function trainLogisticRegression(
  X: number[][],
  y: number[],
  options: Partial<TrainOptions> = {},
): LRWeights {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const n = X.length;
  const dim = X[0].length;

  let w = new Array(dim).fill(0);
  let b = 0;

  for (let epoch = 0; epoch < opts.epochs; epoch++) {
    const gradW = new Array(dim).fill(0);
    let gradB = 0;
    let loss = 0;
    let correct = 0;

    for (let i = 0; i < n; i++) {
      const p = predictProba(X[i], { w, b, dim });
      const err = p - y[i];
      for (let j = 0; j < dim; j++) {
        gradW[j] += err * X[i][j];
      }
      gradB += err;

      const epsilon = 1e-12;
      loss += -(y[i] * Math.log(p + epsilon) + (1 - y[i]) * Math.log(1 - p + epsilon));
      if ((p >= 0.5 ? 1 : 0) === y[i]) correct++;
    }

    for (let j = 0; j < dim; j++) {
      w[j] -= opts.learningRate * (gradW[j] / n + opts.l2 * w[j]);
    }
    b -= opts.learningRate * (gradB / n);

    if (opts.onEpoch && epoch % 50 === 0) {
      opts.onEpoch(epoch, correct / n, loss / n);
    }
  }

  return { w, b, dim };
}
