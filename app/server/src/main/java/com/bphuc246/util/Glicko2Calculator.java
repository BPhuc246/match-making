package com.bphuc246.util;

import java.util.List;

public class Glicko2Calculator {

    private static final double TAU = 0.5; // system constant — how fast volatility can change; 0.3-1.2 typical
    private static final double SCALE = 173.7178;
    private static final double EPSILON = 0.000001;

    public record Glicko2Rating(double rating, double rd, double volatility) {}

    /** score: 1.0 = win, 0.5 = draw, 0.0 = loss */
    public record Opponent(double rating, double rd, double score) {}

    public static Glicko2Rating update(Glicko2Rating player, List<Opponent> opponents) {
        if (opponents.isEmpty()) {
            return player;
        }

        double mu = toMu(player.rating());
        double phi = toPhi(player.rd());
        double sigma = player.volatility();

        double vInvSum = 0;
        double deltaSum = 0;
        for (Opponent o : opponents) {
            double muJ = toMu(o.rating());
            double phiJ = toPhi(o.rd());
            double g = g(phiJ);
            double e = E(mu, muJ, phiJ);
            vInvSum += g * g * e * (1 - e);
            deltaSum += g * (o.score() - e);
        }
        double v = 1.0 / vInvSum;
        double delta = v * deltaSum;

        double a = Math.log(sigma * sigma);
        double A = a;
        double B;
        double deltaSq = delta * delta;
        double phiSq = phi * phi;

        if (deltaSq > phiSq + v) {
            B = Math.log(deltaSq - phiSq - v);
        } else {
            double k = 1;
            while (f(a - k * TAU, delta, phi, v, a) < 0) {
                k++;
            }
            B = a - k * TAU;
        }

        double fA = f(A, delta, phi, v, a);
        double fB = f(B, delta, phi, v, a);

        while (Math.abs(B - A) > EPSILON) {
            double C = A + (A - B) * fA / (fB - fA);
            double fC = f(C, delta, phi, v, a);
            if (fC * fB < 0) {
                A = B;
                fA = fB;
            } else {
                fA = fA / 2;
            }
            B = C;
            fB = fC;
        }

        double newSigma = Math.exp(A / 2);
        double phiStar = Math.sqrt(phiSq + newSigma * newSigma);
        double newPhi = 1.0 / Math.sqrt(1.0 / (phiStar * phiStar) + 1.0 / v);
        double newMu = mu + newPhi * newPhi * deltaSum;

        return new Glicko2Rating(fromMu(newMu), fromPhi(newPhi), newSigma);
    }

    /** Call periodically for players who didn't play in a rating period — inflates their RD over time,
     *  reflecting growing uncertainty about an inactive player's true skill. Optional for now; wire up
     *  via a scheduled job later once basic rating updates are confirmed working. */
    public static Glicko2Rating decayInactive(Glicko2Rating player) {
        double phi = toPhi(player.rd());
        double sigma = player.volatility();
        double phiStar = Math.sqrt(phi * phi + sigma * sigma);
        return new Glicko2Rating(player.rating(), fromPhi(phiStar), sigma);
    }

    private static double g(double phi) {
        return 1.0 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
    }

    private static double E(double mu, double muJ, double phiJ) {
        return 1.0 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));
    }

    private static double f(double x, double delta, double phi, double v, double a) {
        double ex = Math.exp(x);
        double num1 = ex * (delta * delta - phi * phi - v - ex);
        double den1 = 2 * Math.pow(phi * phi + v + ex, 2);
        return (num1 / den1) - ((x - a) / (TAU * TAU));
    }

    /** Probability that player A beats player B, using their current rating/RD. This is
     *  literally the same E() function the algorithm already uses internally to update
     *  ratings — exposing it gives us a principled "predicted fairness" number for free,
     *  no separate model training needed. */
    public static double winProbability(double ratingA, double rdA, double ratingB, double rdB) {
        double muA = toMu(ratingA);
        double muB = toMu(ratingB);
        double phiB = toPhi(rdB);
        return E(muA, muB, phiB);
    }


    private static double toMu(double rating) { return (rating - 1500) / SCALE; }
    private static double toPhi(double rd) { return rd / SCALE; }
    private static double fromMu(double mu) { return mu * SCALE + 1500; }
    private static double fromPhi(double phi) { return phi * SCALE; }
}