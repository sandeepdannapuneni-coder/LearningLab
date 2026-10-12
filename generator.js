// ---------- Helpers ----------

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique(arr, count, exclude) {
  const pool = arr.filter((item) => item !== exclude);
  const chosen = [];
  while (chosen.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

function buildOptions(correct, distractors) {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, answer: options.indexOf(correct) };
}

// ================================================================
// CONTENT-DRIVEN QUESTION ENGINE (Physics)
// Physics chapters/questions live in content.json and are turned into
// live quiz questions here via a small formula registry + two spec
// "kinds": choice (conceptual/troubleshooting) and numeric (computational).
// ================================================================

const FORMULAS = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  multiply3: (a, b, c) => a * b * c,
  divide: (a, b) => a / b,
  multiplyDivide: (a, b, c) => (a * b) / c,
  identity: (a) => a,
  sum3: (a, b, c) => a + b + c,
  average: (a, b) => (a + b) / 2,
  kineticEnergy: (mass, v) => 0.5 * mass * v * v,
  keNoHalf: (mass, v) => mass * v * v,
  halfMassVelocity: (mass, v) => 0.5 * mass * v,
  celsiusToFahrenheit: (c) => (c * 9) / 5 + 32,
  percentIncrease: (orig, updated) => ((updated - orig) / orig) * 100,
  rectanglePerimeter: (l, b) => 2 * (l + b),
  acceleration: (initialSpeed, finalSpeed, time) => (finalSpeed - initialSpeed) / time,
  mirrorImageCount: (angle) => 360 / angle - 1,
  circleArea: (r) => (22 / 7) * r * r,
  circleCircumference: (r) => 2 * (22 / 7) * r,
  floorSqrt: (n) => Math.floor(Math.sqrt(n)),
  sqrtOf: (a) => Math.sqrt(a),
  fullMinusTwo: (full, a, b) => full - a - b,
  affineEval: (a, x, b) => a * x + b,
  sum5: (a, b, c, d, e) => a + b + c + d + e,
  maxOf5: (a, b, c, d, e) => Math.max(a, b, c, d, e),
  minOf5: (a, b, c, d, e) => Math.min(a, b, c, d, e),
  medianOf5: (a, b, c, d, e) => [a, b, c, d, e].sort((x, y) => x - y)[2],
  twoToThePower: (n) => Math.pow(2, n),
  unionMinusOverlap: (a, b, overlap) => a + b - overlap,
  gcd: (a, b) => (b === 0 ? a : FORMULAS.gcd(b, a % b)),
  elementFormula: (rx, ry) => {
    const sub = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
    const toSub = (n) => (n > 1 ? String(n).split("").map((d) => sub[d]).join("") : "");
    return `X${toSub(rx)}Y${toSub(ry)}`;
  },
  outermostShell: (n) => {
    const capacities = [2, 8, 8];
    let remaining = n;
    let last = 0;
    for (const cap of capacities) {
      if (remaining <= 0) break;
      last = Math.min(cap, remaining);
      remaining -= last;
    }
    return last;
  },
  clampMin1: (x, delta) => Math.max(1, x + delta),
  clampMax8: (x, delta) => Math.min(8, x + delta),
  intDiv: (a, b) => Math.floor(a / b),
  absDiff: (a, b) => Math.abs(a - b),
  mod: (a, b) => ((a % b) + b) % b,
  addPercentOf: (value, base, percent) => value + (base * percent) / 100,
  ceilMultiplyDivide: (a, b, c) => Math.ceil((a * b) / c),
  max2: (a, b) => Math.max(a, b),
  min2: (a, b) => Math.min(a, b),
  greaterOf: (a, b, labelA, labelB) => (a > b ? labelA : labelB),
  compoundGrowth: (start, percent, times) => Math.round(start * Math.pow(1 + percent / 100, times)),
  compoundDecay: (start, percent, times) => Math.round(start * Math.pow(1 - percent / 100, times)),
  divideByPower: (value, base, exponent) => value / Math.pow(base, exponent),
  quadraticEval: (a, x, b, c) => a * x * x + b * x + c,
  quadraticLinearMistake: (a, x, b, c) => a * x + b * x + c,
  signSymbol: (x) => (x >= 0 ? "+" : "−"),
  absValue: (x) => Math.abs(x),
  round2: (x) => Math.round(x * 100) / 100,
};

function resolveArg(arg, resolvedVars, correctValue) {
  if (typeof arg === "number") return arg;
  if (arg === "$answer") return correctValue;
  return resolvedVars[arg];
}

function callFormula(formulaId, args, resolvedVars, correctValue) {
  const fn = FORMULAS[formulaId];
  const resolvedArgs = args.map((a) => resolveArg(a, resolvedVars, correctValue));
  return fn(...resolvedArgs);
}

function resolveVar(spec, resolvedVars) {
  switch (spec.type) {
    case "int": {
      const base = spec.offsetOf ? resolvedVars[spec.offsetOf] : 0;
      return base + randInt(spec.min, spec.max);
    }
    case "float": {
      const base = spec.offsetOf ? resolvedVars[spec.offsetOf] : 0;
      return base + randFloat(spec.min, spec.max, spec.decimals);
    }
    case "pick":
      return pick(spec.options);
    case "field":
      // Reads one property off an object already resolved by a "pick" var (e.g. pick
      // a {country, capital} pair once, then expose "country" and "capital" as two
      // separate template vars pointing at the same picked object).
      return resolvedVars[spec.of][spec.key];
    case "computed": {
      let val = callFormula(spec.formulaId, spec.args, resolvedVars, undefined);
      if (spec.round) val = Math.round(val);
      return val;
    }
    case "intList": {
      const count = resolvedVars[spec.sizeVar];
      const values = [];
      while (values.length < count) {
        const v = randInt(spec.min, spec.max);
        if (!values.includes(v)) values.push(v);
      }
      return values.join(", ");
    }
    default:
      return undefined;
  }
}

function interpolate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key]);
}

// Resolves a var spec map regardless of declaration order: "computed" vars may
// reference other vars defined later in the object, so this repeatedly resolves
// whatever is ready until every var has a value (simple fixed-point iteration).
function resolveAllVars(varsSpec) {
  const resolvedVars = {};
  const keys = Object.keys(varsSpec || {});
  const pending = new Set(keys);
  let progress = true;
  while (pending.size > 0 && progress) {
    progress = false;
    for (const key of Array.from(pending)) {
      const varSpec = varsSpec[key];
      const deps =
        varSpec.type === "computed"
          ? varSpec.args
          : varSpec.type === "field"
          ? [varSpec.of]
          : varSpec.offsetOf
          ? [varSpec.offsetOf]
          : varSpec.type === "intList"
          ? [varSpec.sizeVar]
          : [];
      const depsReady = deps.every((a) => typeof a === "number" || Object.prototype.hasOwnProperty.call(resolvedVars, a));
      if (!depsReady) continue;
      resolvedVars[key] = resolveVar(varSpec, resolvedVars);
      pending.delete(key);
      progress = true;
    }
  }
  // Fallback for any unresolved (shouldn't happen for valid specs, e.g. circular refs)
  pending.forEach((key) => {
    resolvedVars[key] = resolveVar(varsSpec[key], resolvedVars);
  });
  return resolvedVars;
}

function formatNumber(num, decimals) {
  if (decimals === "auto") return String(Math.round(num * 10000) / 10000);
  if (decimals === 0) return String(Math.round(num));
  return num.toFixed(decimals);
}

// Nudges the last number embedded in a distractor string so it no longer
// collides with an already-used option (e.g. "56/24" -> "56/27", "12" -> "15").
const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";

function nudgeNumberInText(text, seed) {
  let firstMatch = true;
  // Plain ASCII digits (e.g. "12 cm", "56/24")
  let result = text.replace(/\d+/g, (m) => {
    if (!firstMatch) return m;
    firstMatch = false;
    const n = Number(m);
    const nudged = Math.max(0, n + (seed % 2 === 0 ? seed : -seed));
    return String(nudged);
  });
  if (!firstMatch) return result;
  // Unicode subscript digits (e.g. chemical formulas like "X₂Y₃")
  const subscriptRe = /[₀₁₂₃₄₅₆₇₈₉]+/g;
  result = result.replace(subscriptRe, (m) => {
    if (!firstMatch) return m;
    firstMatch = false;
    const n = Number(m.split("").map((ch) => SUBSCRIPT_DIGITS.indexOf(ch)).join(""));
    const nudged = Math.max(0, n + (seed % 2 === 0 ? seed : -seed));
    return String(nudged)
      .split("")
      .map((ch) => SUBSCRIPT_DIGITS[Number(ch)])
      .join("");
  });
  return result;
}

function buildChoiceQuestion(spec) {
  const variant = pick(spec.variants);
  const resolvedVars = resolveAllVars(variant.vars);
  const question = interpolate(variant.question, resolvedVars);
  const correct = variant.answer !== undefined ? variant.answer : spec.answer;
  const correctText = interpolate(correct, resolvedVars);
  const distractorSource =
    variant.distractors !== undefined ? variant.distractors : pickUnique(spec.distractorPool, spec.distractorCount || 3, correctText);

  const seen = new Set([correctText]);
  const distractors = [];
  distractorSource.forEach((d) => {
    let text = interpolate(d, resolvedVars);
    let nudge = 1;
    while (seen.has(text) && nudge < 20) {
      text = nudgeNumberInText(interpolate(d, resolvedVars), nudge);
      nudge++;
    }
    seen.add(text);
    distractors.push(text);
  });

  const { options, answer } = buildOptions(correctText, distractors);

  // For "known pair" specs (e.g. capital-city questions), each variant can
  // optionally declare what it's actually about via `subject` (e.g. "Japan"
  // for the Tokyo variant). If a wrong option happens to be another variant's
  // correct answer, this explains the mix-up concretely ("Tokyo is the
  // capital of Japan, not Sweden") entirely from data the spec already has —
  // no per-distractor authoring needed. Only applies to literal (non-var)
  // variants, since it matches wrong option text directly against other
  // variants' raw `answer` strings.
  // `wrongAnswerTemplate` fits "identity" facts, where naming the wrong option's
  // true owner IS the useful correction (a capital city belongs to exactly one
  // country). It's a poor fit for "classification" facts like country->continent,
  // where many subjects share one category value — citing an arbitrary other
  // member of that category (e.g. "Asia is Japan's continent") is true but doesn't
  // answer what the student actually needs for the subject they were asked about.
  // `correctionTemplate` covers that case instead: it always restates the current
  // subject's own correct answer against whichever wrong option was picked, with
  // no cross-variant lookup at all, so it's never a non-sequitur.
  let optionExplanations;
  if (spec.wrongAnswerTemplate && variant.subject) {
    const subjectByAnswer = {};
    spec.variants.forEach((v) => {
      if (v.subject && v.answer !== undefined) subjectByAnswer[v.answer] = v.subject;
    });
    optionExplanations = options.map((opt) => {
      if (opt === correctText) return null;
      const wrongSubject = subjectByAnswer[opt];
      if (!wrongSubject) return null;
      return interpolate(spec.wrongAnswerTemplate, { wrongAnswer: opt, wrongSubject, correctSubject: variant.subject });
    });
  } else if (spec.correctionTemplate && variant.subject) {
    optionExplanations = options.map((opt) => {
      if (opt === correctText) return null;
      return interpolate(spec.correctionTemplate, { wrongAnswer: opt, correctAnswer: correctText, correctSubject: variant.subject });
    });
  }

  const technicalIntricacySource = variant.technicalIntricacy !== undefined ? variant.technicalIntricacy : spec.technicalIntricacy;
  const realPurposeSource = variant.realPurpose !== undefined ? variant.realPurpose : spec.realPurpose;

  return {
    question,
    options,
    answer,
    technicalIntricacy: interpolate(technicalIntricacySource, resolvedVars),
    realPurpose: interpolate(realPurposeSource, resolvedVars),
    optionExplanations,
  };
}

function buildNumericQuestion(spec) {
  const resolvedVars = resolveAllVars(spec.vars);
  const question = interpolate(spec.questionTemplate, resolvedVars);
  const correctNum = callFormula(spec.answerFormulaId, spec.answerArgs, resolvedVars, undefined);
  const unit = spec.unit || "";
  const prefix = spec.prefix || "";
  const correctFormatted = prefix + formatNumber(correctNum, spec.decimals) + unit;

  const distractorSet = new Set();
  const distractorCfg = spec.distractors || {};
  const count = distractorCfg.count || 3;

  (distractorCfg.alternates || []).forEach((alt) => {
    let text;
    if (alt.template) {
      text = interpolate(alt.template, resolvedVars);
    } else {
      const val = callFormula(alt.formulaId, alt.args, resolvedVars, correctNum);
      text = prefix + formatNumber(val, spec.decimals) + unit;
    }
    if (text !== correctFormatted) distractorSet.add(text);
  });

  if (distractorCfg.perturb) {
    const { min, max, decimals, minValue } = distractorCfg.perturb;
    const perturbDecimals = decimals != null ? decimals : spec.decimals === "auto" ? 2 : spec.decimals;
    let attempts = 0;
    while (distractorSet.size < count && attempts < 200) {
      attempts++;
      const candidateNum = correctNum + randFloat(min, max, perturbDecimals);
      if (minValue !== undefined && candidateNum < minValue) continue;
      const candidateText = prefix + formatNumber(candidateNum, spec.decimals) + unit;
      if (candidateText !== correctFormatted) distractorSet.add(candidateText);
    }
  }

  // Safety net: alternate-formula distractors can coincidentally collide with each
  // other or the correct answer for specific random values (e.g. two different
  // "common mistake" formulas producing the same number). Guarantee `count`
  // distinct options regardless, using a small deterministic nudge sequence.
  let fallbackTry = 1;
  while (distractorSet.size < count && fallbackTry < 50) {
    const nudge = correctNum !== 0 ? Math.abs(correctNum) * 0.05 * fallbackTry : fallbackTry;
    const candidateNum = correctNum + (fallbackTry % 2 === 0 ? nudge : -nudge);
    const candidateText = prefix + formatNumber(candidateNum, spec.decimals) + unit;
    if (candidateText !== correctFormatted) distractorSet.add(candidateText);
    fallbackTry++;
  }

  const { options, answer } = buildOptions(correctFormatted, Array.from(distractorSet).slice(0, count));
  return {
    question,
    options,
    answer,
    technicalIntricacy: interpolate(spec.technicalIntricacy, resolvedVars),
    realPurpose: interpolate(spec.realPurpose, resolvedVars),
  };
}

function buildQuestionFromSpec(spec) {
  return spec.kind === "numeric" ? buildNumericQuestion(spec) : buildChoiceQuestion(spec);
}

// Questions per attempt, by difficulty level.
const LEVEL_QUESTION_COUNTS = { 1: 10, 2: 5, 3: 3 };

// Draws `targetCount` question ids from `specIds` without repeats when there
// are enough unique specs. If a lesson/level ever has fewer specs than the
// target (shouldn't happen for any current content, but content authoring
// mistakes or a newly-added, not-yet-fully-populated lesson could still hit
// this), cycles through repeated shuffled passes rather than silently
// returning a shorter-than-requested quiz.
function drawQuestionIds(specIds, targetCount) {
  if (specIds.length >= targetCount) return pickUnique(specIds, targetCount);
  const drawn = [];
  while (drawn.length < targetCount) {
    const remaining = targetCount - drawn.length;
    drawn.push(...pickUnique(specIds, Math.min(remaining, specIds.length)));
  }
  return drawn;
}

function buildLessonEntry(lesson, pool) {
  return {
    title: lesson.title,
    overview: lesson.overview,
    deepDivePurpose: lesson.deepDivePurpose,
    recap: lesson.recap,
    generateQuiz: function (level) {
      const specIds = lesson.questionBank[String(level)] || lesson.questionBank["1"];
      const targetCount = LEVEL_QUESTION_COUNTS[level] || LEVEL_QUESTION_COUNTS[1];
      const chosenIds = drawQuestionIds(specIds, targetCount);
      return chosenIds.map((id) => buildQuestionFromSpec(pool[id]));
    },
  };
}

function buildSubjectFromContentData(subjectData) {
  const pool = subjectData.questionPool;
  const lessons = {};
  Object.keys(subjectData.chapters).forEach((chapterKey) => {
    const chapter = subjectData.chapters[chapterKey];
    if (chapter.lessons) {
      // Chapter groups multiple named lessons (e.g. Mathematics: "Numbers" -> Integers, Fractions, ...)
      Object.keys(chapter.lessons).forEach((lessonKey) => {
        lessons[lessonKey] = buildLessonEntry(chapter.lessons[lessonKey], pool);
      });
    } else {
      // Chapter IS the lesson (e.g. Physics: each of the 17 chapters is its own lesson)
      lessons[chapterKey] = buildLessonEntry(chapter, pool);
    }
  });
  return { title: subjectData.title, lessons };
}

// Content lives as one file per subject (content/<key>.json) rather than a single
// monolithic content.json, so that editing or regenerating one subject's question
// bank never requires touching (or risks corrupting) any other subject's data, and
// each subject's data only needs to be parsed/loaded by whichever browser session
// actually asks for it to be built.
// Content is namespaced by grade (content/grade<N>/<subject>.json) so that adding
// next year's curriculum is a pure content drop — create content/grade8/*.json and
// list it in manifest.json, with zero changes needed here or in index.html's grade
// selector (which reads icseEngine.availableGrades, populated below).
async function loadContentDrivenSubjects(requestedGrade) {
  const manifestRes = await fetch("content/manifest.json");
  if (!manifestRes.ok) throw new Error("Failed to load content/manifest.json: " + manifestRes.status);
  const manifest = await manifestRes.json();

  icseEngine.availableGrades = manifest.grades.map((g) => ({ grade: g.grade, label: g.label || `Class ${g.grade}` }));

  const gradeConfig =
    manifest.grades.find((g) => g.grade === requestedGrade) ||
    manifest.grades.find((g) => g.grade === manifest.defaultGrade) ||
    manifest.grades[0];

  if (!gradeConfig) throw new Error("No grade configuration found in content/manifest.json");

  icseEngine.currentGrade = gradeConfig.grade;

  const results = await Promise.allSettled(
    gradeConfig.subjects.map(async (subjectKey) => {
      const res = await fetch(`content/grade${gradeConfig.grade}/${subjectKey}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

  results.forEach((result, i) => {
    const subjectKey = gradeConfig.subjects[i];
    if (result.status === "fulfilled") {
      icseEngine[subjectKey] = buildSubjectFromContentData(result.value);
    } else {
      // One subject's file being missing/malformed shouldn't take down every
      // other content-driven subject — log it and let the rest load normally.
      console.warn(`Could not load content for subject "${subjectKey}" (grade ${gradeConfig.grade}):`, result.reason);
    }
  });
}

// ================================================================
// ENGINE
// ================================================================

const icseEngine = {};
icseEngine.loadContent = loadContentDrivenSubjects;

// ================================================================
// MICRO-LEARNING FEED ENGINE
// ================================================================

icseEngine.getMicroFeed = function () {
  return [
    {
      id: "sci-blackhole",
      category: "Space & Tech",
      headline: "Why Black Holes Aren't Actually 'Holes'",
      insight: "A black hole is an incredibly dense region of space where gravity is so strong that not even light can escape it. It forms when a massive star collapses in on itself at the end of its life, packing an enormous amount of mass into a tiny space.",
      takeaway: "Next time you hear 'black hole,' picture a super-squeezed star with intense gravity — not an empty gap in space.",
      spokenStage: "If a friend calls it 'a hole in space,' try: 'It's not empty — it's a collapsed star packed so densely that gravity traps even light.'",
    },
    {
      id: "sci-heart-rate",
      category: "Human Body",
      headline: "Your Heart Beats About 100,000 Times a Day",
      insight: "Your heart is a muscular pump that beats roughly 100,000 times every single day, pushing blood through tens of thousands of miles of blood vessels. Exercise makes your heart stronger over time, the same way lifting weights strengthens your arm muscles.",
      takeaway: "Regular physical activity, even just walking daily, trains your heart to pump more efficiently for the rest of your life.",
      spokenStage: "Next time someone asks why exercise matters, say: 'Training your heart is like training any muscle — it works about 100,000 times today alone.'",
    },
    {
      id: "sci-plasma-state",
      category: "Chemistry",
      headline: "The 'Fourth State of Matter' You See Every Day",
      insight: "Beyond solid, liquid and gas, there's a fourth state called plasma, made of charged particles, and it's actually the most common state of matter in the universe. Lightning, neon signs, and the Sun itself are all made of glowing plasma.",
      takeaway: "When you see a neon sign glowing, you're looking at plasma in action — the same state of matter that powers stars.",
      spokenStage: "If someone says there are only three states of matter, mention: 'There's a fourth — plasma — and it's actually the most common state in the whole universe.'",
    },
    {
      id: "sci-light-delay",
      category: "Physics",
      headline: "Why You're Always Looking Into the Past",
      insight: "Light travels incredibly fast, but it still takes time to cross any distance, so the images your eyes receive are always slightly delayed. Sunlight, for example, takes about 8 minutes to reach Earth, meaning you always see the Sun as it looked 8 minutes ago.",
      takeaway: "Astronomers use this delay to study ancient starlight, effectively looking back in time at the history of the universe.",
      spokenStage: "If a friend says 'seeing is believing,' point out: 'Not exactly — sunlight itself is 8 minutes old by the time it reaches your eyes.'",
    },
    {
      id: "sci-earth-magnet",
      category: "Physics",
      headline: "Earth Is a Giant, Invisible Magnet",
      insight: "Deep inside Earth, swirling liquid iron generates a magnetic field that stretches far out into space, acting like a giant bar magnet. This invisible field is exactly what makes a compass needle point north.",
      takeaway: "Understanding Earth's magnetic field helps scientists protect satellites and astronauts from harmful solar radiation.",
      spokenStage: "If someone asks how a compass works, explain: 'Earth's core generates a magnetic field like a giant bar magnet — that's literally what the needle is responding to.'",
    },
    {
      id: "phy-terminal-velocity",
      category: "Physics",
      headline: "Why a Feather and a Hammer Fall at the Same Speed (On the Moon)",
      insight: "On Earth, air resistance slows a feather far more than a hammer, making the hammer appear to fall faster. But in a vacuum, like on the Moon, there's no air resistance at all, so gravity accelerates every object at exactly the same rate regardless of its mass — astronaut David Scott demonstrated this live on the Apollo 15 mission.",
      takeaway: "Air resistance, not gravity, is usually the reason light objects seem to fall slower than heavy ones.",
      spokenStage: "If someone says heavy things always fall faster, mention: 'Only because of air resistance — on the Moon, a feather and a hammer hit the ground at the same time.'",
    },
    {
      id: "phy-circuit-short",
      category: "Physics",
      headline: "Why a 'Short Circuit' Is Actually About a Shortcut",
      insight: "A short circuit happens when electricity finds an unintended path of very low resistance, letting a huge current flow suddenly instead of through the intended circuit components. That sudden surge is exactly why short circuits generate dangerous heat and can start fires.",
      takeaway: "The word 'short' refers to a shortened, low-resistance path for current — not the circuit being physically small.",
      spokenStage: "If a friend asks what a short circuit actually is, say: 'It's current taking a low-resistance shortcut instead of flowing through the circuit properly — that surge is what makes it dangerous.'",
    },
    {
      id: "chem-rust-oxidation",
      category: "Chemistry",
      headline: "Rust Isn't Dirt — It's Iron Slowly Burning",
      insight: "Rust forms when iron reacts with oxygen and water over time, a slow chemical process called oxidation, releasing a small amount of energy the same way burning does, just far more slowly. This is why rusting iron actually gains mass rather than losing it — it's chemically combining with oxygen from the air.",
      takeaway: "Rusting and burning are both oxidation reactions — rusting is just oxidation happening extremely slowly instead of all at once.",
      spokenStage: "Next time someone calls rust just 'dirt,' explain: 'It's actually a slow chemical reaction with oxygen — the same basic process as burning, just stretched out over months or years.'",
    },
    {
      id: "chem-solutions-saturation",
      category: "Chemistry",
      headline: "Why Stirring Sugar Into Cold Tea Only Works Up to a Point",
      insight: "A solution becomes 'saturated' once it holds the maximum amount of solute (like sugar) that the solvent (like water) can dissolve at that temperature — beyond that, extra sugar simply won't dissolve no matter how long you stir. Because warmer water can dissolve more solute, that same tea could dissolve more sugar if heated.",
      takeaway: "If stirring longer isn't dissolving something, the solution has likely reached saturation — the fix is usually more solvent or more heat, not more stirring.",
      spokenStage: "If someone keeps stirring sugar that won't dissolve, try: 'The tea's probably saturated already — warming it up would let it hold more sugar.'",
    },
    {
      id: "math-doubling-rice",
      category: "Mathematics",
      headline: "How Doubling a Grain of Rice 64 Times Outgrows the Planet",
      insight: "Place one grain of rice on a chessboard square, then double it on each following square (1, 2, 4, 8...). By the 64th square, the total number of grains is over 18 quintillion — far more rice than has ever been harvested in human history. This is the classic illustration of exponential growth: doubling feels slow at first, then suddenly becomes enormous.",
      takeaway: "Exponential growth (like compound interest, or a virus spreading) always looks small and manageable right up until it suddenly doesn't — that's what makes it so easy to underestimate.",
      spokenStage: "If a friend says exponential growth 'doesn't seem like a big deal,' try: 'It's the chessboard-and-rice problem — doubling looks tiny for a while, then explodes almost overnight.'",
    },
    {
      id: "math-triangle-inequality",
      category: "Mathematics",
      headline: "Why Some 'Triangles' Can Never Actually Exist",
      insight: "Not just any three lengths can form a triangle — the sum of any two sides must always be greater than the third side. Try to build a triangle with sides 2 cm, 3 cm, and 6 cm and the two shorter sides simply won't reach each other. This rule is called the Triangle Inequality.",
      takeaway: "Before accepting a set of three measurements as a real triangle, quickly check that every pair of sides adds up to more than the remaining side.",
      spokenStage: "Next time someone asks if any three lengths can form a triangle, say: 'Only if the two shorter sides together are longer than the longest side — otherwise they can't even meet.'",
    },
    {
      id: "bio-nerve-speed",
      category: "Biology",
      headline: "Some Nerve Signals in Your Body Travel Over 100 Metres Per Second",
      insight: "Not all nerve impulses travel at the same speed — signals along myelinated (insulated) nerve fibres can travel over 100 metres per second, while signals along unmyelinated fibres can be far slower. This is why reflexes, like pulling your hand off something hot, feel almost instant.",
      takeaway: "The insulating myelin sheath around a nerve fibre isn't just protective — it's what allows some signals in your body to travel dramatically faster than others.",
      spokenStage: "If someone asks why reflexes feel instant, try: 'Certain nerve fibres are insulated with myelin, letting signals race over 100 metres per second.'",
    },
    {
      id: "bio-plant-vs-animal-cell",
      category: "Biology",
      headline: "Why Plants Don't Need to 'Eat' Like Animals Do",
      insight: "Plant cells contain chloroplasts, which capture sunlight and convert carbon dioxide and water into glucose through photosynthesis — essentially making their own food. Animal cells lack chloroplasts entirely, which is exactly why animals must eat other organisms to get energy.",
      takeaway: "The presence or absence of chloroplasts is one of the clearest differences between how plants and animals get their energy.",
      spokenStage: "If a friend asks why plants don't need to eat, explain: 'Plant cells have chloroplasts that make food directly from sunlight — animal cells don't have that option, so we have to eat instead.'",
    },
    {
      id: "gk-eurozone",
      category: "Geopolitics",
      headline: "Not Every European Country Uses the Euro",
      insight: "While the Euro is shared by many European Union countries, some, like the United Kingdom and Switzerland, still use their own separate currencies. Deciding whether to join the Euro is a major economic and political decision each country makes independently.",
      takeaway: "Before assuming a country's currency, always check — sharing a continent doesn't mean sharing money.",
      spokenStage: "If someone assumes every European country uses the Euro, say: 'Not quite — the UK and Switzerland, for example, kept their own currencies.'",
    },
    {
      id: "gk-great-wall-myth",
      category: "World Wonders",
      headline: "A Famous 'Fact' About the Great Wall That Isn't True",
      insight: "Despite being thousands of kilometers long, the Great Wall of China is actually too narrow to be seen from space with the naked eye. Its incredible length doesn't automatically make it visible from such a great distance, since width matters just as much.",
      takeaway: "Always double-check popular 'facts' — even famous claims about the world can turn out to be myths.",
      spokenStage: "If a friend repeats the 'visible from space' claim, try: 'That's actually a myth — it's long, but too narrow to be seen with the naked eye from orbit.'",
    },
    {
      id: "gk-diwali",
      category: "Culture & Arts",
      headline: "One Festival, Countless Ways to Celebrate",
      insight: "Diwali, the Festival of Lights, is celebrated by millions of people across India and around the world, often with oil lamps, fireworks, and sweets. Different regions and communities celebrate it with their own unique stories and traditions, all centered on the triumph of light over darkness.",
      takeaway: "Learning about festivals like Diwali builds appreciation for how the same celebration can look different across cultures.",
      spokenStage: "If someone asks what Diwali celebrates, say: 'The Festival of Lights celebrates light triumphing over darkness — though different regions celebrate it in their own unique ways.'",
    },
    {
      id: "gk-un-role",
      category: "Governance",
      headline: "The UN Isn't a 'World Government'",
      insight: "The United Nations is an organization where countries voluntarily cooperate on shared issues like peace and human rights, but it doesn't have the power to directly control any nation. Instead, it relies on member countries agreeing to work together toward common goals.",
      takeaway: "Understanding how international cooperation actually works helps you read world news more accurately.",
      spokenStage: "If a friend calls the UN a 'world government,' clarify: 'It's actually voluntary cooperation between countries — the UN can't force any nation to do anything.'",
    },
    {
      id: "gk-capital-myth",
      category: "Geopolitics",
      headline: "The Biggest City Isn't Always the Capital",
      insight: "Many people assume a country's largest or most famous city must be its capital, but that's often not true. Australia's capital is Canberra (not Sydney), and the United States' capital is Washington, D.C. (not New York City).",
      takeaway: "When learning geography, always double-check a country's official capital instead of assuming it's the most famous city.",
      spokenStage: "If someone assumes the biggest city is always the capital, mention: 'Not always — Australia's capital is Canberra, not Sydney.'",
    },
    {
      id: "gk-antarctica-desert",
      category: "Geopolitics",
      headline: "The World's Largest Desert Isn't the Sahara",
      insight: "A desert is technically defined by low precipitation, not sand or heat — and by that definition, Antarctica is the largest desert on Earth, since it receives extremely little snowfall or rain despite being covered in ice. The Sahara is only the largest hot desert.",
      takeaway: "Always check whether a claim about 'the biggest' or 'the largest' is using the full technical definition, or just the popular assumption.",
      spokenStage: "If someone insists the Sahara is the world's largest desert, say: 'Only the largest hot one — technically, Antarctica qualifies as a desert too, and it's bigger.'",
    },
    {
      id: "gk-un-veto",
      category: "Governance",
      headline: "Why Some UN Decisions Can Be Stopped by Just One Country",
      insight: "The UN Security Council has five permanent members (the US, UK, France, Russia, and China), each holding veto power — meaning any single one of them can block a resolution even if every other country supports it. This design reflects the balance of power when the UN was founded in 1945.",
      takeaway: "Understanding the veto system explains why some international crises see the UN unable to act, even with widespread global agreement.",
      spokenStage: "If someone asks why the UN doesn't 'just fix' certain conflicts, mention: 'Any one of five permanent Security Council members can veto a resolution alone, even if every other country agrees.'",
    },
    {
      id: "adapt-lateral-thinking",
      category: "Lateral Thinking",
      headline: "Stuck? Try Solving It Backward",
      insight: "When a problem feels impossible from the usual starting point, try working backward from the goal you want to reach instead. This technique, called 'working backward,' often reveals a path that wasn't obvious when moving forward.",
      takeaway: "Next time you're stuck on a tricky puzzle or assignment, try starting from the answer and tracing your way back to the beginning.",
      spokenStage: "If a friend feels stuck on a problem, suggest: 'Try working backward from the answer instead of forward from the start — sometimes that reveals the path.'",
    },
    {
      id: "adapt-growth-mindset",
      category: "Growth Mindset",
      headline: "Mistakes Are Data, Not Verdicts",
      insight: "A single failed attempt at something new doesn't measure your true ability — it's simply useful feedback about what to adjust next time. People with a growth mindset treat setbacks as temporary and specific, not permanent proof of a lack of talent.",
      takeaway: "After a mistake, ask 'What specifically can I adjust?' instead of concluding 'I'm just not good at this.'",
      spokenStage: "If someone says 'I'm just bad at this' after one mistake, try: 'That's one data point, not a verdict — what specifically would you adjust next time?'",
    },
    {
      id: "adapt-tradeoffs",
      category: "Decision-Making",
      headline: "There's No 'Perfect' Choice, Only Trade-offs",
      insight: "Most real decisions involve trading one benefit for another, rather than finding one flawless option with zero downsides. Recognizing this helps you compare choices fairly instead of searching endlessly for a 'perfect' answer that may not exist.",
      takeaway: "When facing a tough decision, list what you'd gain and give up with each option — it often makes the choice much clearer.",
      spokenStage: "If a friend is stuck comparing two options, suggest: 'There's rarely a perfect choice — try listing what you'd gain and give up with each one instead.'",
    },
    {
      id: "adapt-feedback-loops",
      category: "Systems Thinking",
      headline: "Why Small Changes Can Cause Big Effects",
      insight: "In interconnected systems, a small change in one part can trigger a feedback loop that amplifies into a much larger effect elsewhere. This is why adding more lanes to a busy road can sometimes attract even more traffic instead of reducing congestion.",
      takeaway: "Before fixing just one visible piece of a problem, consider how the whole system might react and adapt to that change.",
      spokenStage: "If someone's surprised a small fix made things worse, explain: 'That can happen in interconnected systems — a feedback loop can amplify a change in ways you wouldn't expect.'",
    },
    {
      id: "adapt-gamblers-fallacy",
      category: "Probability & Reasoning",
      headline: "The Coin Doesn't Remember Its Last Flip",
      insight: "If a fair coin lands on heads five times in a row, many people assume tails is 'due' next — but each flip is completely independent, so the odds remain exactly 50/50. This common reasoning error is known as the gambler's fallacy.",
      takeaway: "Remember that random, independent events, like coin flips or dice rolls, have no memory of what happened before.",
      spokenStage: "If a friend says tails is 'due' after several heads in a row, say: 'The coin doesn't remember — each flip is independent, so the odds are still 50/50.'",
    },
    {
      id: "adapt-anchoring-bias",
      category: "Decision-Making",
      headline: "Why the First Number You See Changes Your Judgment",
      insight: "Anchoring bias means the first piece of information you encounter, even an unrelated number, can unconsciously influence your later estimates or decisions. Studies show that people asked to guess a value after seeing an arbitrary high or low number first tend to guess closer to that number, even when they know it's irrelevant.",
      takeaway: "When making an important estimate, notice what number you saw first, and deliberately double-check your judgment isn't just anchored to it.",
      spokenStage: "If a friend seems swayed by the first price or number they heard, say: 'That might just be anchoring bias — try estimating it again without that number in mind.'",
    },
    {
      id: "adapt-devils-advocate",
      category: "Systems Thinking",
      headline: "Why Arguing Against Your Own Idea Makes It Stronger",
      insight: "Deliberately searching for reasons your own plan might fail, sometimes called 'devil's advocate' thinking, helps surface weaknesses before they become real problems, rather than only searching for reasons you're right (confirmation bias).",
      takeaway: "Before committing to an important decision, spend a few minutes actively arguing against it — the goal is to stress-test the idea, not to talk yourself out of it.",
      spokenStage: "If a friend is fully confident in a plan, ask: 'What's the strongest argument against this? Have you tried to prove yourself wrong yet?'",
    },
    {
      id: "sat-context-clues",
      category: "SAT Vocabulary",
      headline: "Context Beats Vocabulary Memorization",
      insight: "On the Digital SAT, the correct word for a blank is determined entirely by context clues in the surrounding sentence, not by how impressive or rare the word sounds. A simple, familiar word is just as likely to be correct as an advanced one.",
      takeaway: "When choosing an answer, always plug it back into the sentence and check that it matches the exact logical relationship required.",
      spokenStage: "If someone tries to memorize vocabulary lists for the SAT, mention: 'Context matters more than the word itself — the right answer always fits the specific sentence.'",
    },
    {
      id: "sat-comma-splice",
      category: "SAT Grammar",
      headline: "The Sneaky Error Called a Comma Splice",
      insight: "A comma splice happens when two complete sentences are joined with only a comma and no connecting word, which is a common grammar error. Instead, you can fix it with a period, a semicolon, or a comma plus a word like 'and' or 'but.'",
      takeaway: "Whenever you see two complete thoughts joined by just a comma, check whether it actually needs a stronger connector instead.",
      spokenStage: "If you spot two complete sentences joined by just a comma, say: 'That's a comma splice — it needs a period, a semicolon, or a conjunction instead.'",
    },
    {
      id: "sat-quadratic-roots",
      category: "SAT Math",
      headline: "The Coefficients Aren't the Answer",
      insight: "When solving a quadratic equation like x<sup>2</sup> + 5x + 6 = 0, it's tempting to think the numbers 5 and 6 are the solutions — but they're not. The real solutions come from factoring the equation into two smaller expressions and solving each one separately.",
      takeaway: "Always finish the factoring process fully before assuming you've found the correct roots of a quadratic equation.",
      spokenStage: "If someone assumes the coefficients ARE the answer, clarify: 'Not quite — you have to fully factor the equation first; the numbers in it aren't the roots themselves.'",
    },
    {
      id: "sat-negative-flip",
      category: "SAT Math",
      headline: "One Sign Flip That Changes Everything",
      insight: "When solving an inequality, dividing or multiplying both sides by a negative number requires flipping the inequality sign to keep the statement true. Forgetting this single step is one of the most common mistakes on inequality questions.",
      takeaway: "Before finalizing an inequality answer, double-check whether you divided by a negative number — and flip the sign if you did.",
      spokenStage: "If a friend forgets this rule, remind them: 'Dividing or multiplying an inequality by a negative number flips the sign — it's one of the most commonly missed steps.'",
    },
    {
      id: "sat-evidence-precision",
      category: "SAT Strategy",
      headline: "Being 'On Topic' Isn't Enough",
      insight: "On Command of Evidence questions, the correct quotation must directly and specifically prove the exact claim given — simply mentioning the same general topic isn't sufficient. This is one of the most common traps test-takers fall into.",
      takeaway: "Before selecting evidence, restate the claim in your own words, then check that your chosen quote actually proves it.",
      spokenStage: "If someone picks evidence that's just 'on topic,' say: 'That's not enough — it has to directly prove the exact claim, not just relate to it generally.'",
    },
    {
      id: "sat-transition-words",
      category: "SAT Grammar",
      headline: "One Word Can Flip the Meaning of an Entire SAT Sentence",
      insight: "Transition words like 'however,' 'therefore,' and 'similarly' each signal a specific logical relationship — contrast, cause-effect, or similarity — and picking the wrong one can completely reverse a sentence's intended meaning, even if every other word is correct.",
      takeaway: "Before choosing a transition word on a grammar question, identify the exact logical relationship between the two ideas first, then match a word to that relationship.",
      spokenStage: "If you're stuck between two transition words, try: 'Do these two ideas agree, contrast, or show cause-and-effect?' — that answers which word actually fits.",
    },
    {
      id: "sat-plug-back-in",
      category: "SAT Math",
      headline: "The Fastest Way to Check Any Multiple-Choice Math Answer",
      insight: "On SAT-style math questions, one of the fastest ways to verify (or find) a correct answer is to plug each answer choice directly back into the original equation or condition, rather than always solving algebraically from scratch.",
      takeaway: "When a problem feels stuck or time is short, plugging in the answer choices is often faster than deriving the answer from the beginning.",
      spokenStage: "If someone's stuck on a multiple-choice math problem, suggest: 'Try plugging each answer choice back into the equation — sometimes that's faster than solving it directly.'",
    },
    {
      id: "st2-voyager-golden-record",
      category: "Space & Tech",
      headline: "The Record NASA Sent to Aliens... Just in Case",
      insight: "Each Voyager spacecraft, launched in 1977, carries a gold-plated phonograph record loaded with sounds and images from Earth — music, greetings in 55 languages, whale calls, and photos of everyday life. It's meant to be a kind of time capsule, in case an intelligent alien civilization ever finds one of the probes drifting through interstellar space. NASA even included symbolic instructions on the cover showing how to play it, since a needle and turntable aren't exactly obvious technology.",
      takeaway: "The Golden Record is a reminder that space missions aren't only about collecting data — sometimes they're also messages, sent with almost no chance of ever being read, just in case.",
      spokenStage: "If a friend asks what the farthest human-made object is doing right now, try: \"It's Voyager 1, and it's still carrying a golden record of Earth sounds in case aliens ever find it.\"",
    },
    {
      id: "st2-satellite-orbit-falling",
      category: "Space & Tech",
      headline: "Why Satellites Don't Just Fall Out of the Sky",
      insight: "A satellite in orbit is actually falling toward Earth the entire time — it just moves sideways fast enough that the ground curves away beneath it at the same rate it falls. That balance between falling and moving forward is what keeps it circling the planet instead of crashing or flying off into space. It's the same idea as throwing a ball hard enough that it would go all the way around the Earth before hitting the ground.",
      takeaway: "Orbit isn't 'escaping gravity' — it's constantly falling and constantly missing the ground, which is a much more useful way to picture how satellites, and even the Moon, stay up.",
      spokenStage: "If a friend asks why satellites don't fall down, say: \"They actually are falling — they're just moving sideways so fast that they keep missing the Earth.\"",
    },
    {
      id: "st2-microgravity-not-zero-g",
      category: "Space & Tech",
      headline: "Astronauts Aren't Floating Because There's 'No Gravity' Up There",
      insight: "On the International Space Station, gravity is still about 90% as strong as it is on Earth's surface — nowhere near zero. Astronauts float because the station and everything inside it, including their bodies, are all falling around the Earth together at the same rate, which cancels out the feeling of weight. This state is called microgravity, not zero gravity.",
      takeaway: "If gravity really vanished, the ISS would fly off in a straight line instead of orbiting — it's the constant falling, not an absence of gravity, that makes astronauts float.",
      spokenStage: "If a friend says there's no gravity in space, say: \"Actually there's almost as much gravity up there as down here — astronauts float because they're falling along with the station.\"",
    },
    {
      id: "st2-gps-time-correction",
      category: "Space & Tech",
      headline: "Your GPS Would Drift Off Course Without a Tiny Time Fix",
      insight: "GPS satellites carry incredibly precise atomic clocks, and because they orbit fast and far from Earth, time actually ticks at a very slightly different rate for them than it does for you on the ground. If engineers didn't correct for this tiny mismatch, GPS location errors would build up by many kilometres within just a single day. So the satellites' clocks are deliberately adjusted to stay in sync with clocks on Earth.",
      takeaway: "Even something as everyday as map navigation depends on scientists accounting for how time behaves differently at high speed and altitude — physics you can't see is working behind every 'blue dot' on your phone.",
      spokenStage: "If a friend asks how GPS is so accurate, say: \"The satellites' clocks actually run at a slightly different speed than ours, so engineers correct for it constantly or your location would drift off.\"",
    },
    {
      id: "st2-mars-red-color",
      category: "Space & Tech",
      headline: "Mars Is Red for the Same Reason Old Nails Turn Orange",
      insight: "The Martian surface is covered in iron-rich dust and rock, and over billions of years that iron has reacted with tiny amounts of oxygen to form iron oxide — the same reddish-brown compound as rust on Earth. This thin, rusty dust coats nearly the entire planet, which is why Mars glows reddish-orange even from millions of kilometres away. Winds regularly stir the dust into the thin Martian atmosphere, sometimes creating planet-wide dust storms.",
      takeaway: "Mars's famous color isn't paint or lava — it's essentially a whole planet's worth of rust, built up slowly over an unimaginable amount of time.",
      spokenStage: "If a friend asks why Mars looks red, say: \"It's basically covered in rust — iron in the rocks reacted with oxygen over billions of years.\"",
    },
    {
      id: "st2-tidal-locking-moon",
      category: "Space & Tech",
      headline: "Why You've Never Seen the Far Side of the Moon",
      insight: "The Moon takes almost exactly the same amount of time to spin once on its axis as it does to orbit once around Earth, so the same side always faces us. This isn't a coincidence — Earth's gravity gradually slowed the Moon's spin over billions of years until it locked into this rhythm, a process called tidal locking. The 'far side' isn't dark; it just isn't visible from Earth, and it gets just as much sunlight as the near side does over the course of a month.",
      takeaway: "People sometimes call it the 'dark side of the Moon,' but it's really the 'far side' — dark only in the sense of being unseen from Earth, not unlit by the Sun.",
      spokenStage: "If a friend calls it the 'dark side of the moon,' try: \"It's not dark, just hidden from us — the Moon is tidally locked so the same side always faces Earth.\"",
    },
    {
      id: "st2-rocket-vacuum-thrust",
      category: "Space & Tech",
      headline: "Rockets Don't Need Air to Push Against",
      insight: "A common myth is that rockets work by pushing against the air behind them, like an oar pushing against water. In reality, rockets work through Newton's third law: burning fuel shoots hot gas out the back at high speed, and that gas pushes the rocket forward with an equal and opposite force. This means rockets actually work fine, even better, in the vacuum of space, where there's no air resistance slowing them down.",
      takeaway: "Thrust comes from throwing mass one way and getting pushed the other way, which is exactly why rockets can accelerate perfectly well in the emptiness of space.",
      spokenStage: "If a friend says rockets can't work in space because there's no air to push against, say: \"They don't push against air — they push against their own exhaust gas, so they work fine in a vacuum.\"",
    },
    {
      id: "st2-undersea-cables-internet",
      category: "Space & Tech",
      headline: "Most of the Internet Travels Through Cables at the Bottom of the Ocean",
      insight: "Even though satellites get a lot of attention, the vast majority of international internet traffic — emails, video calls, streaming — actually flows through hundreds of thousands of kilometres of fiber-optic cables laid along the ocean floor. These cables use pulses of light to send data between continents almost at the speed of light, and they're far cheaper and faster overall than routing everything through satellites.",
      takeaway: "The next time you video call someone on another continent, picture the signal racing through a cable thinner than a garden hose, lying on the seafloor — that's the real backbone of the internet.",
      spokenStage: "If a friend thinks the internet mostly runs through satellites, say: \"Actually most of it travels through fiber-optic cables laid across the ocean floor.\"",
    },
    {
      id: "st2-star-twinkle-planets-dont",
      category: "Space & Tech",
      headline: "Why Stars Twinkle But Planets Usually Don't",
      insight: "Stars are so far away that they appear as single points of light, and as that thin beam of light passes through Earth's shifting, turbulent atmosphere, it gets bent slightly in different directions, making the star appear to flicker or 'twinkle.' Planets, on the other hand, are much closer and appear as tiny disks rather than single points, so the atmosphere's wobbling has far less noticeable effect on their light — they tend to shine with a steadier glow.",
      takeaway: "You can actually use this to tell stars from planets with just your eyes: a steady, non-flickering point of light in the night sky is more likely to be a planet.",
      spokenStage: "If a friend asks how to tell a planet from a star in the sky, say: \"Look for the twinkle — planets usually shine steady, while stars flicker because of our atmosphere.\"",
    },
    {
      id: "ph2-pressure-nail-vs-palm",
      category: "Physics",
      headline: "Why a Nail Hurts More Than a Flat Push With the Same Force",
      insight: "Pressure isn't just about how hard you push — it's force spread over an area, calculated as force divided by area. Pressing your palm flat against a wall spreads your force over a large area, so the pressure at any one point is low. Press with the sharp point of a nail using that same force, and the area is tiny, so the pressure at that point becomes enormous.",
      takeaway: "Whenever something feels surprisingly sharp or surprisingly gentle for its force, think about area — concentrating force onto a small area is exactly how needles, knives, and animal claws work.",
      spokenStage: "If a friend asks why a thumbtack hurts more than pushing with your thumb flat, say: \"Same force, but way less area, so the pressure at that tiny point is huge.\"",
    },
    {
      id: "ph2-sound-no-vacuum",
      category: "Physics",
      headline: "In Space, No One Can Hear Anything At All",
      insight: "Sound is a vibration that travels by bumping molecules into each other, whether in air, water, or a solid. Space is a near-total vacuum, with almost no molecules to carry those vibrations, so sound simply has nothing to travel through. This is why real footage of spacewalks and rocket launches from orbit is eerily silent except for the astronaut's own suit radio.",
      takeaway: "Movies that show explosions roaring in space are taking dramatic license — without a medium like air, there's genuinely nothing to carry the sound wave.",
      spokenStage: "If a friend says a spaceship exploding in a movie 'sounds real,' say: \"Actually it couldn't make any sound at all — there's no air in space to carry sound waves.\"",
    },
    {
      id: "ph2-convection-currents",
      category: "Physics",
      headline: "Why Heat Rises: The Convection Currents Around You",
      insight: "When a liquid or gas is heated, the warmed particles spread out and become less dense than the cooler particles around them, so they rise while cooler, denser fluid sinks to take their place. This constant looping motion is called a convection current, and it's why a radiator warms a whole room, why boiling water churns, and even why weather patterns form in the atmosphere.",
      takeaway: "Whenever you notice warm air pooling near the ceiling while your feet feel cold on the floor, that's convection in action — density differences caused by heat, not heat 'floating' on its own.",
      spokenStage: "If a friend asks why the top of a room feels warmer than the bottom, say: \"That's convection — warm air is less dense, so it rises and cooler air sinks to replace it.\"",
    },
    {
      id: "ph2-refraction-bent-straw",
      category: "Physics",
      headline: "Why a Straw Looks 'Broken' in a Glass of Water",
      insight: "Light travels at different speeds through different materials — faster through air, slower through water. When light passes from air into water at an angle, it bends slightly at that boundary, a phenomenon called refraction. Because the light bends, the part of the straw underwater appears to be in a different position than the part above water, making it look bent or disconnected.",
      takeaway: "The straw itself is perfectly straight — your eyes are just reconstructing an image from bent light, which is a good reminder that vision doesn't always show you geometry exactly as it is.",
      spokenStage: "If a friend says a straw actually bends in water, say: \"It's not bent — that's refraction, light changing direction as it moves between water and air.\"",
    },
    {
      id: "ph2-static-electricity-balloon",
      category: "Physics",
      headline: "Why a Rubbed Balloon Sticks to Your Hair",
      insight: "Rubbing a balloon on your hair transfers tiny negatively charged particles called electrons from your hair onto the balloon's surface, leaving the balloon slightly negatively charged and your hair slightly positive. Since opposite charges attract, the balloon and your hair pull toward each other, and the balloon can even stick to a wall because its charge causes electrons in the wall to shift slightly away, creating an attractive pull on its surface.",
      takeaway: "Static electricity isn't magic — it's just electrons being physically moved from one surface to another, leaving both sides charged until they eventually rebalance.",
      spokenStage: "If a friend asks why a balloon sticks to their hair after rubbing it, say: \"You transferred electrons onto the balloon, so now it's charged differently than your hair and they attract.\"",
    },
    {
      id: "ph2-momentum-conservation-collision",
      category: "Physics",
      headline: "Why a Rolling Ball Can Make a Stopped One Shoot Forward",
      insight: "In any collision, the total momentum of the objects involved stays the same before and after — this is called conservation of momentum. When a moving ball hits an identical stationary ball head-on, it can transfer nearly all of its momentum to the second ball, causing the first to stop almost completely while the second shoots off at close to the original speed. This is exactly what happens in a Newton's cradle desk toy.",
      takeaway: "Momentum doesn't disappear in a collision — it just gets redistributed between the objects, which is why predicting what happens after a crash always starts with tracking where the momentum goes.",
      spokenStage: "If a friend asks how a Newton's cradle works, say: \"It's conservation of momentum — the swinging ball transfers nearly all its momentum to the last ball in line.\"",
    },
    {
      id: "ph2-buoyancy-steel-ships-float",
      category: "Physics",
      headline: "Why a Massive Steel Ship Doesn't Sink Like a Steel Bolt",
      insight: "Whether something floats depends on its overall density compared to water, not just what it's made of. A solid steel bolt is denser than water and sinks, but a ship's hull is shaped into a hollow form that displaces — pushes aside — a huge volume of water, making the ship's overall density, steel plus all that empty air-filled space inside, less than water's. The water pushes back up with a force equal to the weight of water displaced, called buoyant force, which is enough to support the ship's full weight.",
      takeaway: "Floating isn't about being 'light' — it's about shape and overall density, which is why hollowing out a heavy material can turn something that would sink into something that floats easily.",
      spokenStage: "If a friend asks how a giant steel ship floats when steel sinks, say: \"It's not about the metal — the hollow shape displaces enough water that the ship's overall density is less than water's.\"",
    },
    {
      id: "ph2-resonance-marching-bridge",
      category: "Physics",
      headline: "Why Soldiers Break Step Crossing a Bridge",
      insight: "Every structure, including a bridge, has a natural frequency it tends to vibrate at. If a repeated force — like the rhythmic footsteps of marching soldiers — happens to match that natural frequency, the vibrations can build up bigger and bigger through a phenomenon called resonance, potentially shaking the structure dangerously. That's why marching troops are traditionally ordered to break step, walking out of rhythm, when crossing bridges, so their footsteps don't reinforce each other.",
      takeaway: "Small, repeated pushes at exactly the right timing can build into a much bigger effect than a single large push — that's the core idea behind resonance, useful for musicians tuning instruments and important for engineers designing bridges.",
      spokenStage: "If a friend asks why soldiers are told to break step on a bridge, say: \"It's to avoid resonance — marching in rhythm could match the bridge's natural frequency and shake it dangerously.\"",
    },
    {
      id: "ph2-doppler-effect-siren",
      category: "Physics",
      headline: "Why a Siren's Pitch Changes as It Drives Past You",
      insight: "As an ambulance approaches, its sound waves get compressed closer together in front of it, which raises the pitch you hear; as it moves away, the waves stretch out behind it, lowering the pitch. This shift in sound frequency caused by relative motion is called the Doppler effect, and it happens with any wave source moving relative to a listener, not just sirens.",
      takeaway: "The siren itself never actually changes pitch — your ears are detecting how motion squeezes and stretches the sound waves, a principle also used by police radar guns and astronomers studying how galaxies move.",
      spokenStage: "If a friend asks why a siren sounds higher-pitched as it approaches and lower as it leaves, say: \"That's the Doppler effect — the sound waves bunch up in front and stretch out behind as it moves.\"",
    },
    {
      id: "ch2-dry-ice-sublimation",
      category: "Chemistry",
      headline: "The 'Smoke' From Dry Ice Skips a Whole Step",
      insight: "Dry ice is frozen carbon dioxide, and unlike regular ice, it doesn't melt into a liquid at normal air pressure — it goes directly from a solid to a gas, a process called sublimation. The foggy 'smoke' effect people see isn't the carbon dioxide gas itself, which is invisible, but tiny water droplets from the air condensing in the intense cold around the dry ice.",
      takeaway: "Not every solid has to pass through a liquid stage to become a gas — sublimation is a good reminder that the three states of matter don't always change in the order you'd expect.",
      spokenStage: "If a friend asks why dry ice doesn't leave a puddle like regular ice, say: \"It sublimates — it turns straight from solid to gas without ever becoming a liquid.\"",
    },
    {
      id: "ch2-ph-scale-acids-bases",
      category: "Chemistry",
      headline: "The Number Line That Tells You If Something Will Fizz or Feel Slippery",
      insight: "The pH scale runs from 0 to 14 and measures how acidic or basic (alkaline) a substance is. A pH below 7 means acidic (like lemon juice or vinegar), exactly 7 is neutral (like pure water), and above 7 means basic (like soap or a baking soda solution). Each whole step on the scale represents a tenfold change in acidity, so a pH of 4 is ten times more acidic than a pH of 5.",
      takeaway: "Because the scale is logarithmic, small differences in pH number represent big real differences in strength — a pH of 2 isn't just 'a bit more acidic' than a pH of 4, it's about a hundred times more acidic.",
      spokenStage: "If a friend asks what makes something an acid versus a base, say: \"It's about pH — below 7 is acidic, above 7 is basic, and each step is actually ten times stronger.\"",
    },
    {
      id: "ch2-atoms-elements-periodic-table",
      category: "Chemistry",
      headline: "Why the Periodic Table Isn't Just a Random Grid",
      insight: "Every element on the periodic table is arranged by its atomic number — the number of protons in one atom of that element — and elements are grouped into columns based on how many electrons sit in their outermost shell, which largely determines how they react chemically. That's why elements in the same column, like the noble gases or the alkali metals, tend to behave in similar ways even though they can look completely different.",
      takeaway: "The layout of the periodic table isn't decoration — it's a map of chemical behavior, so knowing an element's position can help you predict how it will react before you ever run an experiment.",
      spokenStage: "If a friend asks why elements in the same column of the periodic table act similarly, say: \"They have the same number of outer electrons, and that's mostly what controls how an element reacts.\"",
    },
    {
      id: "ch2-mixtures-vs-compounds",
      category: "Chemistry",
      headline: "Trail Mix vs. Table Salt: The Real Difference Between a Mixture and a Compound",
      insight: "In a compound like table salt, sodium and chlorine atoms are chemically bonded together in a fixed ratio, forming a completely new substance with its own properties, different from either original element. In a mixture, like trail mix or salt water, the different substances are just physically combined — they keep their own individual properties and can usually be separated back out again by physical means, like sorting or evaporating.",
      takeaway: "If you can separate the ingredients back apart just by physical means, like filtering or picking them out by hand, you're dealing with a mixture; if it takes a chemical reaction to break it apart, it's a compound.",
      spokenStage: "If a friend mixes up 'mixture' and 'compound,' say: \"A compound is chemically bonded into something new, but a mixture just has things stirred together that you could physically separate again.\"",
    },
    {
      id: "ch2-physical-vs-chemical-change",
      category: "Chemistry",
      headline: "How to Tell If Something Just Changed Shape or Actually Became Something New",
      insight: "A physical change, like melting ice or tearing paper, alters how a substance looks or is arranged, but the substance itself is still chemically the same stuff underneath. A chemical change, like burning wood or an egg cooking, rearranges atoms into entirely new substances with different properties, and it's usually impossible to reverse just by physical means. Clues that a chemical change happened include a color change, a new smell, bubbling gas, or a release of heat or light that wasn't put in on purpose.",
      takeaway: "Before assuming something 'just changed,' check whether you could get the original substance back by simple physical steps — if not, atoms were probably rearranged into something genuinely new.",
      spokenStage: "If a friend asks whether toasting bread is a physical or chemical change, say: \"It's chemical — the heat rearranges molecules in the bread into new substances, which is why you can't untoast it.\"",
    },
    {
      id: "ch2-fire-triangle-combustion",
      category: "Chemistry",
      headline: "Why Blowing Out a Candle Actually Works",
      insight: "Fire is a chemical reaction, called combustion, that needs three things at once to keep burning: fuel, oxygen, and enough heat to keep the reaction going. This is often called the fire triangle. Blowing on a candle flame doesn't just push the flame away — it scatters the heat and disrupts the flow of oxygen to the wick faster than the candle can keep replenishing them, so the reaction can't sustain itself and the flame goes out.",
      takeaway: "To stop any fire, you only need to remove one side of the triangle — which is exactly why smothering a fire with a blanket (cutting off oxygen) or dousing it with water (cooling below the needed heat) both work.",
      spokenStage: "If a friend asks why blowing on a candle puts it out, say: \"You're disrupting the oxygen and heat it needs — fire needs fuel, oxygen, and heat all at once, called the fire triangle.\"",
    },
    {
      id: "ch2-oil-water-density-immiscible",
      category: "Chemistry",
      headline: "Why Salad Dressing Always Separates Back Out",
      insight: "Oil and water don't mix because their molecules are structured very differently — water molecules are attracted strongly to each other and effectively push oil molecules out of the way rather than surrounding them, a property called being immiscible. Since oil is also less dense than water, once the two separate, the oil layer floats on top no matter how hard you shake the bottle beforehand.",
      takeaway: "Shaking a bottle of dressing doesn't actually dissolve the oil into the water — it just temporarily breaks it into tiny droplets, which is why the layers reliably separate again given enough time.",
      spokenStage: "If a friend asks why salad dressing separates in the fridge, say: \"Oil and water don't mix because their molecules don't attract each other, and oil is less dense, so it floats back to the top.\"",
    },
    {
      id: "ch2-catalysts-enzymes-speed-reactions",
      category: "Chemistry",
      headline: "The Chemical Helpers That Speed Things Up Without Getting Used Up",
      insight: "A catalyst is a substance that speeds up a chemical reaction without being permanently changed or consumed by it, meaning the same catalyst can be used again and again. Your own saliva contains a catalyst called an enzyme that starts breaking down starch into sugar the moment food enters your mouth, which is part of why bread can start tasting slightly sweet if you chew it for a long time.",
      takeaway: "Whenever a reaction seems to speed up dramatically without anything obvious being 'used up,' a catalyst is probably at work quietly making it easier for the reaction to happen.",
      spokenStage: "If a friend asks why chewing bread for a while makes it taste sweeter, say: \"An enzyme in your saliva is a catalyst that's already breaking the starch down into sugar.\"",
    },
    {
      id: "ch2-electrolysis-splitting-water",
      category: "Chemistry",
      headline: "How Electricity Can Split Water Into Two Different Gases",
      insight: "Pure water is a compound made of hydrogen and oxygen atoms bonded together, but running an electric current through water can break those bonds apart in a process called electrolysis. The electricity forces the water molecules to split, releasing hydrogen gas at one electrode and oxygen gas at the other — and because water contains twice as many hydrogen atoms as oxygen atoms, you get roughly twice the volume of hydrogen gas produced.",
      takeaway: "Electrolysis is a clean demonstration that even a substance as familiar as water is really a chemical combination of simpler elements, held together by bonds that electricity can break apart.",
      spokenStage: "If a friend asks how you could get hydrogen gas out of water, say: \"Electrolysis — running an electric current through water splits it into hydrogen and oxygen gas.\"",
    },
    {
      id: "hb2-skin-renewal",
      category: "Human Body",
      headline: "Your Skin Replaces Itself Every Few Weeks",
      insight: "Your entire outer layer of skin is completely replaced roughly every 4 weeks. Skin cells form deep in the epidermis, then slowly get pushed upward as newer cells form beneath them, until they die, flatten out, and flake off the surface. You lose thousands of dead skin cells every single day without ever noticing it happening.",
      takeaway: "The skin you see in the mirror today is almost entirely different from the skin you had a month ago — your body is constantly rebuilding itself.",
      spokenStage: "If a friend says their skin never changes, try: 'Actually it does — your whole outer layer gets swapped out for a new one about once a month.'",
    },
    {
      id: "hb2-bone-fusion",
      category: "Human Body",
      headline: "Babies Have More Bones Than Adults Do",
      insight: "A newborn baby has around 300 separate bones, but an adult has only 206. Bones don't disappear — many small bones, especially in the skull and spine, gradually fuse together into single, larger bones as a child grows. This fusing process isn't fully finished until a person is in their twenties.",
      takeaway: "Growing up literally means your skeleton is still being assembled — bones that are separate pieces now may end up locked together for life.",
      spokenStage: "If someone asks why babies seem so bendy, say: 'Their bones haven't fused yet — they actually start with about 300 bones and end up with 206.'",
    },
    {
      id: "hb2-liver-regen",
      category: "Human Body",
      headline: "Your Liver Can Regrow Itself",
      insight: "The liver is the only organ in your body that can regenerate a large portion of its own tissue. If part of a healthy liver is removed or damaged, the remaining cells can multiply and rebuild the organ back to nearly its original size within a few months. Other organs, like the heart, cannot recover from serious damage nearly as well.",
      takeaway: "Not every organ heals the same way — the liver's unique regenerating ability is exactly why liver transplants can work using just a partial donation.",
      spokenStage: "If a friend asks why liver donors don't need to give up a whole liver, say: 'The liver can actually regrow — it's one of the only organs that can rebuild itself.'",
    },
    {
      id: "hb2-taste-smell",
      category: "Human Body",
      headline: "Most of What You 'Taste' Is Actually Smell",
      insight: "Your tongue can only detect a handful of basic tastes — sweet, salty, sour, bitter, and umami. Most of the rich flavor you experience while eating actually comes from your nose, since odor molecules from food travel up through the back of your throat to smell receptors. That's why food tastes bland when your nose is blocked by a cold.",
      takeaway: "If a meal suddenly tastes 'boring' when you're stuffy, it's not your taste buds failing — it's your sense of smell being blocked.",
      spokenStage: "If a friend wonders why food tastes weird with a stuffy nose, say: 'Most of what we call taste is actually smell — your tongue only picks up a few basics.'",
    },
    {
      id: "hb2-immune-memory",
      category: "Human Body",
      headline: "Your Immune System Keeps a 'Wanted List' of Old Germs",
      insight: "After your body fights off an infection, some white blood cells called memory cells stick around for years, sometimes decades. They remember exactly what that specific germ looked like, so if it ever invades again, your immune system can recognize and destroy it far faster the second time. This is also the basic idea behind how vaccines work.",
      takeaway: "Getting sick once, or getting vaccinated, isn't just unpleasant — it's training your immune system to recognize and beat that exact threat much faster in the future.",
      spokenStage: "If a friend asks why vaccines still help years later, say: 'Your immune system keeps memory cells that recognize the germ instantly if it shows up again.'",
    },
    {
      id: "hb2-sleep-growth",
      category: "Human Body",
      headline: "Your Body Does Most of Its Growing While You Sleep",
      insight: "Growth hormone, which helps build bone and muscle tissue, is released in much larger pulses during deep sleep than during the day. Sleep is also when the body repairs damaged cells and strengthens memories formed earlier that day. Skipping sleep doesn't just make you tired — it can directly interfere with these repair and growth processes.",
      takeaway: "Treating sleep as optional ignores the fact that a lot of your body's actual growth and repair work only happens while you're unconscious.",
      spokenStage: "If someone brags about staying up all night, try: 'Your body does most of its actual growing during deep sleep, so you're kind of skipping the important part.'",
    },
    {
      id: "hb2-stomach-acid",
      category: "Human Body",
      headline: "Your Stomach Acid Is Strong Enough to Dissolve Metal",
      insight: "The hydrochloric acid in your stomach is roughly as acidic as battery acid, strong enough to dissolve a razor blade over time. Your stomach avoids digesting itself because its inner lining is coated in a thick layer of mucus and rapidly replaces its cells every few days. Without that protective mucus layer, the acid would start eating through the stomach wall.",
      takeaway: "The mucus lining isn't a minor detail — it's the only thing standing between your stomach acid and your stomach itself.",
      spokenStage: "If someone doubts stomach acid is that strong, say: 'It's about as strong as battery acid — your stomach only survives it because of a thick mucus lining.'",
    },
    {
      id: "hb2-blink-reflex",
      category: "Human Body",
      headline: "You Blink About 15 Times a Minute Without Deciding To",
      insight: "Blinking is mostly an automatic reflex controlled by your brainstem, not a conscious choice, and it happens roughly 15 to 20 times every minute. Each blink spreads a thin layer of tears across the eye, washing away dust and keeping the surface from drying out. Your brain also smooths over the tiny gaps in vision during each blink, so you barely notice your eyes going dark thousands of times a day.",
      takeaway: "The next time you focus hard and blink less, remember it's a reflex fighting your concentration — your eyes still need those regular resets to stay protected.",
      spokenStage: "If a friend says they forgot to blink while gaming, say: 'Blinking is mostly automatic — you actually do it about 15 times a minute without even deciding to.'",
    },
    {
      id: "hb2-kidney-filter",
      category: "Human Body",
      headline: "Your Kidneys Filter Your Entire Blood Supply Dozens of Times a Day",
      insight: "Your two kidneys filter all of the blood in your body roughly 40 times every day, removing waste products and excess water to make urine. Each kidney contains about a million tiny filtering units called nephrons that do this work continuously, even while you sleep. Only a small fraction of what gets filtered actually leaves the body — most of the water and useful substances get reabsorbed back into the blood.",
      takeaway: "Your kidneys are constantly cleaning your blood in the background, so staying hydrated directly helps them keep doing that filtering job efficiently.",
      spokenStage: "If someone asks what kidneys actually do all day, say: 'They filter your entire blood supply about 40 times a day, non-stop.'",
    },
    {
      id: "bio2-mitochondria-power",
      category: "Biology",
      headline: "Why Mitochondria Are Called the 'Powerhouse of the Cell'",
      insight: "Mitochondria are tiny structures inside most cells that convert the energy from food into a usable form called ATP, which powers almost everything a cell does. Cells that need lots of energy, like muscle cells, contain thousands of mitochondria, while cells that need less energy have far fewer. Scientists believe mitochondria were once separate free-living bacteria that got absorbed into other cells billions of years ago and stayed there permanently.",
      takeaway: "When a cell needs to do a lot of work, like a muscle contracting again and again, it's often the mitochondria count inside it that makes that possible.",
      spokenStage: "If a friend asks why muscle cells have so many mitochondria, say: 'They need way more energy, and mitochondria are what convert food into usable power for the cell.'",
    },
    {
      id: "bio2-dna-code-universal",
      category: "Biology",
      headline: "The Same Genetic Code Runs Almost Every Living Thing",
      insight: "DNA uses the same basic four-letter chemical alphabet — A, T, C, and G — in essentially every organism on Earth, from bacteria to oak trees to humans. The specific order of these letters is what differs and determines whether the resulting organism is a mushroom or a human being. This shared code is one of the strongest pieces of evidence that all life on Earth descended from a common ancestor.",
      takeaway: "Even wildly different-looking organisms are, at the chemical level, running the same basic genetic 'programming language' — just with very different code written in it.",
      spokenStage: "If someone asks how DNA proves living things are related, say: 'Almost every organism uses the exact same four-letter genetic code — just arranged in different orders.'",
    },
    {
      id: "bio2-food-chain-producers",
      category: "Biology",
      headline: "Almost Every Food Chain Starts With the Sun",
      insight: "Producers, mainly plants and algae, make their own food using sunlight through photosynthesis, and they form the base of nearly every food chain on Earth. Energy then flows from producers to the animals that eat them, and again to the animals that eat those consumers. At each step up the chain, a lot of energy is lost as heat, which is why food chains rarely have more than four or five levels.",
      takeaway: "Even a lion eating a zebra is, a few steps removed, running on energy that originally came from sunlight captured by plants.",
      spokenStage: "If a friend asks why food chains are usually short, say: 'Energy gets lost as heat at every step, so there's rarely enough left to support more than a few levels.'",
    },
    {
      id: "bio2-keystone-species",
      category: "Biology",
      headline: "One Species Can Hold an Entire Ecosystem Together",
      insight: "A keystone species has an unusually large effect on its ecosystem compared to its numbers, so much that removing it can cause the whole system to collapse or change dramatically. A famous example is sea otters, which eat sea urchins that would otherwise destroy kelp forests if left unchecked. When keystone species disappear, many other species that depend on the balance they maintain can disappear too.",
      takeaway: "Protecting an ecosystem often means identifying and protecting its keystone species first, since losing just one of them can trigger effects across the whole food web.",
      spokenStage: "If someone asks why one animal's disappearance can wreck a whole ecosystem, say: 'It might be a keystone species — the whole system depends on it more than you'd expect from its numbers.'",
    },
    {
      id: "bio2-taxonomy-ranks",
      category: "Biology",
      headline: "Every Living Thing Fits Into the Same Eight-Level Filing System",
      insight: "Scientists classify every organism using a nested set of ranks: domain, kingdom, phylum, class, order, family, genus, and species, going from the broadest group down to the most specific. Humans, for example, belong to the species Homo sapiens within the genus Homo, and organisms sharing a lower rank are more closely related than those only sharing a higher one. This system lets scientists worldwide agree on exactly which organism they mean, even across different languages.",
      takeaway: "When you see a two-part scientific name like Homo sapiens, you're seeing the two most specific levels of a much larger classification system.",
      spokenStage: "If a friend asks what a genus and species name actually means, say: 'It's the two most specific ranks in a system that classifies every living thing from broad to narrow.'",
    },
    {
      id: "bio2-dominant-recessive",
      category: "Biology",
      headline: "Why Two Brown-Eyed Parents Can Have a Blue-Eyed Kid",
      insight: "Many traits are controlled by pairs of genes called alleles, and some alleles are dominant while others are recessive. If a parent carries one dominant and one recessive allele, the dominant trait usually shows up, but the recessive allele can still be passed down silently. If both parents happen to pass down their hidden recessive allele to a child, the recessive trait can suddenly appear even though neither parent showed it.",
      takeaway: "A trait skipping a generation and then reappearing isn't a mystery — it usually means a recessive allele was quietly carried along the whole time.",
      spokenStage: "If someone's confused how two brown-eyed parents got a blue-eyed baby, say: 'They probably both carried a hidden recessive allele for blue eyes that lined up in their kid.'",
    },
    {
      id: "bio2-symbiosis-mutualism",
      category: "Biology",
      headline: "Some Species Survive by Helping Each Other Out",
      insight: "Mutualism is a relationship between two different species where both benefit. Clownfish, for example, live safely among sea anemone tentacles that would sting other fish, while the clownfish chases off predators and drops food scraps that the anemone eats. This kind of partnership is common throughout nature and shows that competition isn't the only strategy that helps species survive.",
      takeaway: "Not every relationship in nature is a fight for survival — sometimes cooperating with a completely different species is the better strategy.",
      spokenStage: "If a friend asks why clownfish don't get stung by anemones, say: 'It's a mutualism — the anemone protects the clownfish, and the clownfish protects and feeds the anemone back.'",
    },
    {
      id: "bio2-decomposers-role",
      category: "Biology",
      headline: "Nothing in Nature Actually Goes to Waste",
      insight: "Decomposers, like fungi and bacteria, break down dead plants, animals, and waste into simpler nutrients that go back into the soil. Without decomposers, nutrients like nitrogen and carbon would stay locked inside dead organisms forever, and ecosystems would eventually run out of the raw materials needed to grow new life. This recycling process is just as essential to an ecosystem as producers making food from sunlight.",
      takeaway: "Decomposers aren't just about decay looking gross — they're the recycling system that keeps every ecosystem's nutrients in circulation.",
      spokenStage: "If someone thinks decomposers are just gross, say: 'They're actually the recyclers of every ecosystem — nutrients couldn't cycle back into the soil without them.'",
    },
    {
      id: "bio2-mimicry-defense",
      category: "Biology",
      headline: "Some Harmless Animals Survive by Copying Dangerous Ones",
      insight: "Mimicry is when a harmless species evolves to look like a dangerous or unpleasant-tasting one, tricking predators into avoiding it. The harmless scarlet kingsnake, for instance, has color patterns similar to the venomous coral snake, even though it has no venom of its own. Over many generations, individuals that happened to look more like the dangerous species survived more often and passed that resemblance on.",
      takeaway: "Looking dangerous can be just as useful for survival as actually being dangerous, which is exactly what mimicry exploits.",
      spokenStage: "If a friend asks why a harmless snake looks so much like a venomous one, say: 'That's mimicry — looking dangerous scares off predators just as well as actually being dangerous.'",
    },
    {
      id: "mt2-infinite-primes",
      category: "Mathematics",
      headline: "There Is No Biggest Prime Number",
      insight: "A prime number is a whole number greater than 1 that can only be divided evenly by 1 and itself, like 2, 3, 5, 7, and 11. Over 2,000 years ago, the mathematician Euclid proved that no matter how large a prime number you find, there is always a larger one still waiting to be discovered. This means the list of prime numbers goes on forever, even though they get rarer and harder to find as numbers get bigger.",
      takeaway: "Searching for 'the largest prime' is a pointless quest by definition — mathematicians who hunt for record-breaking primes are really just finding a new large one, never the final one.",
      spokenStage: "If someone asks what the biggest prime number is, say: 'There isn't one — it was proven over 2,000 years ago that primes go on forever.'",
    },
    {
      id: "mt2-pi-irrational",
      category: "Mathematics",
      headline: "Pi's Digits Never Repeat and Never End",
      insight: "Pi is the ratio of a circle's circumference to its diameter, and it's an irrational number, meaning its decimal digits continue forever without ever settling into a repeating pattern. Computers have calculated pi to trillions of digits, but for almost all everyday math, just using 3.14 or 3.14159 is more than accurate enough. No matter how big a circle you draw, this exact same ratio always holds true.",
      takeaway: "You never need pi's 'exact' value for real problems, because a rounded version like 3.14 already gives you all the precision you'd realistically use.",
      spokenStage: "If a friend asks why pi doesn't just end at some digit, say: 'It's irrational — its digits genuinely go on forever without ever repeating in a pattern.'",
    },
    {
      id: "mt2-fibonacci-nature",
      category: "Mathematics",
      headline: "The Same Number Pattern Keeps Showing Up in Nature",
      insight: "The Fibonacci sequence is a list of numbers where each one is the sum of the two before it: 1, 1, 2, 3, 5, 8, 13, 21, and so on. This exact pattern shows up surprisingly often in nature, like the number of spirals in a sunflower's seed head or the arrangement of leaves around a stem. Scientists think plants often grow this way because it's an efficient pattern for packing seeds or catching sunlight without overlapping.",
      takeaway: "Spotting a Fibonacci-like pattern in nature isn't a coincidence — it often reflects an efficient growth strategy that evolution has favored again and again.",
      spokenStage: "If a friend notices spiral patterns in a sunflower, say: 'Those spiral counts are usually Fibonacci numbers — that pattern shows up all over nature.'",
    },
    {
      id: "mt2-birthday-paradox",
      category: "Mathematics",
      headline: "In a Room of Just 23 People, Two Probably Share a Birthday",
      insight: "It seems unlikely, but in a random group of just 23 people, there's actually slightly better than a 50% chance that two of them share the same birthday. This happens because the number of possible pairs of people grows much faster than the number of people themselves — with 23 people there are 253 different pairs to check for a match. It's called the birthday paradox not because it breaks any math rule, but because the result feels so much bigger than intuition expects.",
      takeaway: "Whenever you're estimating the odds of any match happening in a group, remember to think about all the possible pairs, not just the number of individuals.",
      spokenStage: "If someone doubts two people in a small class could share a birthday, say: 'With just 23 people, the odds are actually over 50% — it's called the birthday paradox.'",
    },
    {
      id: "mt2-triangle-angle-sum",
      category: "Mathematics",
      headline: "Every Triangle's Angles Add Up to Exactly 180 Degrees",
      insight: "No matter how thin, wide, or lopsided a triangle looks, its three interior angles always add up to exactly 180 degrees on a flat surface. This can be proven by drawing a line through one vertex parallel to the opposite side and using the angle relationships that parallel lines create. Knowing this rule means that if you already know two angles of any triangle, you can always calculate the third without measuring it.",
      takeaway: "If you ever need a missing angle in a triangle, you don't have to measure it — just subtract the two known angles from 180 degrees.",
      spokenStage: "If a friend is stuck finding a missing triangle angle, say: 'All three angles always add up to 180 degrees, so just subtract the other two from that.'",
    },
    {
      id: "mt2-zero-placeholder",
      category: "Mathematics",
      headline: "Zero Had to Be Invented — It Wasn't Always Around",
      insight: "For a long time, ancient number systems like Roman numerals had no symbol for zero at all, which made calculations and place value confusing. Mathematicians in ancient India were among the first to treat zero as a true number with its own rules, not just an empty placeholder, and this idea spread through the Middle East to Europe over centuries. Without zero, our modern place-value system, where the position of a digit changes its meaning, wouldn't work at all.",
      takeaway: "A concept as simple-seeming as zero was actually a major mathematical breakthrough, and modern arithmetic depends completely on it existing.",
      spokenStage: "If someone assumes zero always existed as a number, say: 'It was actually a major invention — ancient number systems like Roman numerals didn't really have it.'",
    },
    {
      id: "mt2-pascals-triangle",
      category: "Mathematics",
      headline: "One Triangle of Numbers Hides Dozens of Patterns",
      insight: "Pascal's triangle is a triangular arrangement of numbers where each number is the sum of the two numbers directly above it, starting with a single 1 at the top. Hidden inside it are the Fibonacci sequence, the exact coefficients used to expand expressions like (x+y) raised to a power, and even the number of possible combinations when choosing items from a group. Mathematicians in different cultures, including ancient China and Persia, discovered versions of this same triangle centuries before Pascal.",
      takeaway: "A single, simple-to-build number triangle can answer several very different math questions at once, which is why it keeps showing up across different topics.",
      spokenStage: "If a friend asks what Pascal's triangle is even useful for, say: 'It secretly contains combinations, Fibonacci numbers, and expansion coefficients all in one pattern.'",
    },
    {
      id: "mt2-clock-math",
      category: "Mathematics",
      headline: "A Clock Face Is Secretly a Math System Called Modular Arithmetic",
      insight: "Modular arithmetic is math that wraps around after reaching a certain number, exactly like how a clock resets to 1 after passing 12. If it's 10 o'clock and you add 5 hours, you don't get 15 — you wrap around back to 3, because the system only uses numbers 1 through 12. This same wrap-around idea is used in computer science, cryptography, and even figuring out what day of the week a date falls on.",
      takeaway: "Once you notice that clocks, calendars, and even some codes all reset after a certain point, you're already thinking in modular arithmetic without needing the formal name for it.",
      spokenStage: "If someone asks why 10 o'clock plus 5 hours isn't '15 o'clock,' say: 'Clocks use modular arithmetic — they wrap back around after 12 instead of just counting up forever.'",
    },
    {
      id: "mt2-golden-ratio",
      category: "Mathematics",
      headline: "One Ratio Keeps Showing Up in Art, Architecture, and Nature",
      insight: "The golden ratio is a special number, approximately 1.618, that appears when a line is divided so the ratio of the whole to the longer part equals the ratio of the longer part to the shorter part. Artists and architects, including those who built the Parthenon, have used it for centuries because rectangles and spirals based on this ratio are often seen as especially pleasing to the eye. It also connects directly to the Fibonacci sequence, since dividing consecutive Fibonacci numbers gets closer and closer to the golden ratio the further along the sequence you go.",
      takeaway: "When a design or layout looks naturally balanced without you knowing why, there's a decent chance the golden ratio is quietly at work behind its proportions.",
      spokenStage: "If a friend asks why a certain design looks so balanced, say: 'It might use the golden ratio — that proportion shows up in art, architecture, and nature all the time.'",
    },
    {
      id: "geo2-vatican-smallest",
      category: "Geopolitics",
      headline: "The Smallest Country in the World Is Smaller Than Most Parks",
      insight: "Vatican City, home to the Pope and the center of the Catholic Church, is the smallest independent country on Earth at just about 0.2 square miles (roughly 0.44 square kilometers). It's entirely surrounded by the city of Rome, Italy, and you could walk across the whole country in under an hour. Despite its tiny size, it has its own government, postal service, and currency arrangements.",
      takeaway: "Country size has nothing to do with how 'real' or independent a nation is — sovereignty is about recognized self-government, not land area.",
      spokenStage: "If a friend assumes bigger countries are more 'legitimate,' try: 'Vatican City is smaller than most parks, but it's still a fully independent country with its own government.'",
    },
    {
      id: "geo2-russia-timezones",
      category: "Geopolitics",
      headline: "One Country Spans Eleven Time Zones",
      insight: "Russia is so large — stretching across Europe and Asia — that it covers eleven different time zones, more than any other country in the world. When it's morning in Kaliningrad in the west, it's already late evening the same day in Kamchatka in the far east. This is why Russian news broadcasts sometimes air at different local times across the country.",
      takeaway: "A country's size can create huge internal differences, not just in scenery, but in the literal time of day people are living in.",
      spokenStage: "If a friend is confused why someone in Russia seems to be in a totally different part of the day online, say: 'Russia spans eleven time zones — it could easily be a different time of day for them.'",
    },
    {
      id: "geo2-africa-54-countries",
      category: "Geopolitics",
      headline: "Africa Has More Countries Than Any Other Continent",
      insight: "Africa is home to 54 recognized independent countries, more than any other continent, packed into a landmass so large that the United States, China, India, and most of Europe could all fit inside it at once. This huge number of countries reflects thousands of distinct ethnic groups, languages, and histories across the continent.",
      takeaway: "Treating 'Africa' as one uniform place erases enormous diversity — it's more accurate to think of it the way you'd think of Europe or Asia, as many different countries and cultures.",
      spokenStage: "If a friend talks about 'the country of Africa,' try: 'Africa isn't one country — it's a continent with 54 different countries, more than any other continent has.'",
    },
    {
      id: "geo2-doubly-landlocked",
      category: "Geopolitics",
      headline: "Two Countries Are Landlocked Inside Landlocked Countries",
      insight: "A landlocked country has no coastline, but two countries in the world are 'doubly landlocked' — meaning every neighboring country is also landlocked. Liechtenstein, in Europe, is surrounded by Switzerland and Austria, both landlocked themselves. Uzbekistan, in Central Asia, is surrounded entirely by other landlocked countries too.",
      takeaway: "Geography can compound — being landlocked once already limits direct sea trade, but being landlocked twice over means goods often cross several borders before reaching any coast.",
      spokenStage: "If a friend says every landlocked country has at least one coastal neighbor, try: 'Not always — Liechtenstein and Uzbekistan are doubly landlocked, surrounded only by other landlocked countries.'",
    },
    {
      id: "geo2-lesotho-enclave",
      category: "Geopolitics",
      headline: "A Whole Country Sits Entirely Inside Another Country",
      insight: "Lesotho is an independent country in southern Africa that is completely surrounded by a single other country: South Africa. This makes Lesotho what geographers call an 'enclave' — a nation with no border touching any country except the one that encircles it. It has its own government, king, and currency, separate from South Africa.",
      takeaway: "A country's borders don't have to touch an ocean or multiple neighbors to be fully sovereign — being surrounded by just one country doesn't make you part of it.",
      spokenStage: "If a friend assumes every country touches at least two neighbors, try: 'Lesotho is completely surrounded by just one country, South Africa, but it's still its own independent nation.'",
    },
    {
      id: "geo2-cfa-franc",
      category: "Geopolitics",
      headline: "Fourteen Countries Share a Currency That Isn't the Euro",
      insight: "Long before the Eurozone, several West and Central African countries began sharing a common currency called the CFA franc. Fourteen countries, including Senegal, Ivory Coast, and Cameroon, use one of two CFA franc versions today, which simplifies trade between them even though each country has its own government and economy.",
      takeaway: "Sharing a currency across borders isn't unique to Europe — it's a tool many regions use to make trade and travel between neighboring countries easier.",
      spokenStage: "If a friend thinks only the Eurozone shares currency across countries, try: 'Fourteen African countries share the CFA franc for a similar reason — easier trade between neighbors.'",
    },
    {
      id: "geo2-south-africa-languages",
      category: "Geopolitics",
      headline: "One Country Officially Recognizes Eleven Languages",
      insight: "South Africa's constitution recognizes eleven official languages, including Zulu, Xhosa, Afrikaans, and English, reflecting the country's many ethnic communities. Government documents, school instruction, and public signage can legally be provided in any of these languages, and most South Africans speak more than one of them fluently.",
      takeaway: "A country having many official languages usually means switching between languages is a normal part of daily life, not a sign of division.",
      spokenStage: "If a friend is surprised someone speaks three or four languages fluently, try: 'That's normal in South Africa — it has eleven official languages, so multilingual life is just how it works.'",
    },
    {
      id: "geo2-date-line",
      category: "Geopolitics",
      headline: "There's an Invisible Line Where Today Becomes Tomorrow",
      insight: "The International Date Line runs roughly along the 180-degree line of longitude through the Pacific Ocean, zigzagging around some island nations. Cross it heading west and you jump forward a calendar day; cross it heading east and you go back a day, even though the actual time barely changes. It exists so the world has one consistent, agreed-upon way to track which date it is everywhere.",
      takeaway: "Time zones handle the hour of the day, but the date line is the one place the calendar date itself flips — a reminder that 'today' is partly just an agreed-upon convention.",
      spokenStage: "If a friend says a Pacific island is 'a day ahead' and asks how that's possible, say: 'They're just on the other side of the International Date Line — crossing it changes the calendar date, not just the clock.'",
    },
    {
      id: "ww2-great-barrier-reef",
      category: "World Wonders",
      headline: "The Largest Living Structure on Earth Is Underwater",
      insight: "The Great Barrier Reef, off the coast of Australia, stretches over 2,300 kilometers (about 1,400 miles) and is built entirely by billions of tiny animals called coral polyps. It's considered the largest structure on Earth made by living organisms, and it's large enough that astronauts can spot it from space.",
      takeaway: "Some of the biggest things ever built weren't built by machines or humans at all — they were built slowly, one tiny organism at a time, over thousands of years.",
      spokenStage: "If a friend thinks only human construction can be 'huge,' try: 'The Great Barrier Reef is the largest living structure on Earth, and it was built entirely by tiny coral animals.'",
    },
    {
      id: "ww2-machu-picchu-mortar",
      category: "World Wonders",
      headline: "An Ancient City Was Built Without Any Mortar or Glue",
      insight: "Machu Picchu, the 15th-century Inca site high in the Peruvian Andes, was constructed using a technique where stones were cut and fitted together so precisely that no mortar was needed to hold them in place. The joints are so tight that even a thin knife blade can't slide between many of the stones, which is part of why the walls have survived centuries of earthquakes.",
      takeaway: "Precision can be just as strong as glue or cement — sometimes the most durable engineering comes from getting the fit exactly right, not from adding more material.",
      spokenStage: "If a friend assumes old buildings must be held together with cement, try: 'Machu Picchu's stones aren't glued at all — they're cut so precisely they just fit together perfectly.'",
    },
    {
      id: "ww2-petra-rock-city",
      category: "World Wonders",
      headline: "An Entire City Was Carved Directly Into Rock Cliffs",
      insight: "Petra, in modern-day Jordan, is an ancient city where the Nabataean people carved elaborate temples, tombs, and buildings directly into rose-colored sandstone cliffs, starting more than 2,000 years ago. Visitors reach the most famous building, the Treasury, by walking through a narrow, winding rock canyon called the Siq that opens up dramatically at the end.",
      takeaway: "Not every ancient wonder was built up from the ground — some of the most impressive ones were carved down into the landscape that was already there.",
      spokenStage: "If a friend pictures ancient cities as only stacked stone buildings, try: 'Petra wasn't built up from the ground — its temples were carved straight into cliffs of solid rock.'",
    },
    {
      id: "ww2-angkor-wat-largest",
      category: "World Wonders",
      headline: "The World's Largest Religious Monument Started as a Hindu Temple",
      insight: "Angkor Wat, in Cambodia, is the largest religious monument in the world by land area, originally built in the early 1100s as a Hindu temple dedicated to the god Vishnu by the Khmer Empire. Over the following centuries, it gradually transformed into a Buddhist site, and it remains an active place of worship today, alongside being a major archaeological wonder.",
      takeaway: "Religious sites can shift meaning and faith traditions over centuries without losing their significance — Angkor Wat has been sacred for nearly 900 years under two different religions.",
      spokenStage: "If a friend assumes Angkor Wat has always been Buddhist, try: 'It actually started as a Hindu temple in the 1100s and became a Buddhist site over the centuries after.'",
    },
    {
      id: "ww2-victoria-falls",
      category: "World Wonders",
      headline: "A Waterfall Called 'The Smoke That Thunders'",
      insight: "Victoria Falls, on the border of Zambia and Zimbabwe, is classified as the largest single sheet of falling water in the world, based on its combined width of about 1,700 meters and height of over 100 meters. Local communities named it 'Mosi-oa-Tunya,' meaning 'the smoke that thunders,' because the spray from the falls rises so high it can be seen and heard from miles away.",
      takeaway: "Natural wonders often had powerful, descriptive local names long before they got the names most famous internationally — it's worth learning both.",
      spokenStage: "If a friend only knows it as Victoria Falls, try: 'Locals call it Mosi-oa-Tunya, the smoke that thunders, because the spray shoots up so high you can see it from miles off.'",
    },
    {
      id: "ww2-salar-de-uyuni",
      category: "World Wonders",
      headline: "A Desert That Turns Into the World's Largest Mirror",
      insight: "Salar de Uyuni, in Bolivia, is the largest salt flat on Earth, covering over 10,000 square kilometers of land left behind by a prehistoric lake that dried up. During the rainy season, a thin layer of water spreads across the salt and perfectly reflects the sky, turning the entire landscape into what looks like an enormous mirror stretching to the horizon.",
      takeaway: "Extreme, seemingly empty landscapes can hide some of the most visually stunning natural phenomena on the planet.",
      spokenStage: "If a friend is looking at photos of the Bolivian salt flats and asks how they get that mirror effect, say: 'A thin layer of rainwater sits on the huge salt flat and reflects the whole sky perfectly.'",
    },
    {
      id: "ww2-uluru",
      category: "World Wonders",
      headline: "A Single Rock That Rises 348 Metres Out of the Desert",
      insight: "Uluru, located in central Australia, is a massive sandstone rock formation that rises about 348 meters above the surrounding flat desert and stretches even farther underground than it does above. It is sacred to the Anangu, the Aboriginal people who have lived in the area for tens of thousands of years, and it changes color dramatically at sunrise and sunset.",
      takeaway: "Natural landmarks can carry deep cultural and spiritual meaning for the people connected to them, not just be scenery to look at.",
      spokenStage: "If a friend just calls it 'a big red rock,' try: 'It's called Uluru, and it's sacred to the Anangu people who've lived near it for tens of thousands of years.'",
    },
    {
      id: "ww2-great-blue-hole",
      category: "World Wonders",
      headline: "A Giant Sinkhole in the Ocean You Can See From the Air",
      insight: "The Great Blue Hole, off the coast of Belize, is a massive underwater sinkhole about 300 meters across and over 124 meters deep, formed thousands of years ago when the area was dry land with cave systems that later collapsed and flooded as sea levels rose. From above, it appears as a striking, almost perfectly circular dark blue circle surrounded by lighter turquoise reef water.",
      takeaway: "Some ocean features were actually shaped on dry land long ago — rising sea levels transformed collapsed caves into the underwater wonders we see today.",
      spokenStage: "If a friend asks why that circle in the ocean looks so dark and round in photos, say: 'That's the Great Blue Hole in Belize — it was a collapsed cave system on dry land before the sea rose and flooded it.'",
    },
    {
      id: "cul2-carnival-brazil",
      category: "Culture & Arts",
      headline: "A Festival So Big It Involves Year-Round Preparation",
      insight: "Carnival in Brazil, especially in Rio de Janeiro, is one of the largest festivals in the world, drawing millions of participants and spectators for parades, music, and elaborate costumes in the days before the Christian season of Lent. Samba schools, which are large community groups, spend nearly the entire year designing floats and rehearsing choreography for a performance that lasts only a few minutes in the parade.",
      takeaway: "The biggest, most spectacular cultural celebrations are often the result of nearly year-round community effort behind the scenes, not something thrown together quickly.",
      spokenStage: "If a friend thinks Carnival is just one big party, try: 'The samba schools actually spend almost the whole year designing and rehearsing for it — the parade is the payoff.'",
    },
    {
      id: "cul2-griots-westafrica",
      category: "Culture & Arts",
      headline: "The Storytellers Who Carried a Region's History by Memory",
      insight: "In many West African cultures, particularly among the Mande peoples, griots are traditional storytellers, musicians, and historians who memorize and pass down oral histories, genealogies, and songs across generations. Before much of this history was written down, griots served as living libraries, and the role is often still passed down within specific families today.",
      takeaway: "Not all history is preserved in books — oral traditions can carry accurate, detailed knowledge across centuries through memory and performance alone.",
      spokenStage: "If a friend assumes history only survives in writing, try: 'West African griots have preserved detailed oral histories for centuries just by memorizing and performing them.'",
    },
    {
      id: "cul2-flamenco-spain",
      category: "Culture & Arts",
      headline: "A Dance Style Born From Blending Several Cultures Into One",
      insight: "Flamenco developed in the Andalusia region of southern Spain, blending musical and dance traditions from the Romani people, Moorish North Africa, and Jewish and Andalusian communities who lived in the region over centuries. It combines intricate guitar playing, passionate singing called cante, rhythmic handclapping, and expressive dance, and UNESCO recognizes it as an important piece of cultural heritage.",
      takeaway: "Art forms that feel like they belong to one culture are often really the product of many different communities influencing each other over a long time.",
      spokenStage: "If a friend thinks flamenco is 'just Spanish dancing,' try: 'It actually blends Romani, North African, and Jewish traditions that all mixed together in southern Spain.'",
    },
    {
      id: "cul2-origami-japan",
      category: "Culture & Arts",
      headline: "The Ancient Art of Folding Paper Is Also Serious Math",
      insight: "Origami, the Japanese art of paper folding, dates back centuries and traditionally uses a single square sheet of paper without cutting or gluing to create shapes like cranes, boxes, or flowers. Mathematicians and engineers today study the geometry behind origami folds because the same folding principles help design things like compact satellite solar panels and even medical stents that expand inside the body.",
      takeaway: "A centuries-old art form can turn out to hold real mathematical and engineering value, showing that creativity and technical problem-solving aren't as separate as they seem.",
      spokenStage: "If a friend thinks origami is 'just a kids' craft,' try: 'Engineers actually study origami folding patterns to design things like foldable satellite panels.'",
    },
    {
      id: "cul2-haka-newzealand",
      category: "Culture & Arts",
      headline: "A Ceremonial Dance That Became a Symbol of Pride and Unity",
      insight: "The haka is a traditional ceremonial dance of the Maori people of New Zealand, performed with forceful movements, rhythmic chanting, foot-stamping, and facial expressions. Originally used in various contexts including before battle, it's performed today at important occasions like welcoming ceremonies and funerals, and famously by New Zealand's national sports teams before international matches.",
      takeaway: "Traditions can change purpose over time while staying deeply meaningful — the haka moved from a battlefield ritual to a widely respected expression of identity and respect.",
      spokenStage: "If a friend just sees the haka as 'a sports intimidation thing,' try: 'It's actually a traditional Maori ceremonial dance used for all kinds of important occasions, not just sports.'",
    },
    {
      id: "cul2-dayofdead-mexico",
      category: "Culture & Arts",
      headline: "A Holiday That Celebrates Death Instead of Fearing It",
      insight: "Dia de los Muertos, or Day of the Dead, is a Mexican holiday celebrated on November 1st and 2nd where families build colorful altars called ofrendas with photos, marigold flowers, and a deceased loved one's favorite foods, believing their spirits return to visit. Rather than being a somber occasion, it's typically festive, filled with music, storytelling, and bright decorations like painted sugar skulls.",
      takeaway: "Different cultures can approach the same universal experience, like remembering someone who died, in very different emotional tones — celebration instead of only mourning.",
      spokenStage: "If a friend assumes Day of the Dead is a sad holiday, try: 'It's actually pretty festive — families build colorful altars and celebrate the memory of loved ones rather than just mourning.'",
    },
    {
      id: "cul2-calligraphy-china",
      category: "Culture & Arts",
      headline: "Handwriting That's Considered One of the Highest Art Forms",
      insight: "In Chinese culture, calligraphy, the artistic writing of characters with a brush and ink, has been practiced and refined for over 2,000 years and is traditionally regarded as one of the highest visual art forms, ranked alongside painting. The way a character's strokes are shaped, weighted, and paced is thought to reveal the writer's skill and emotion, not just the words being written.",
      takeaway: "The way something is written can be considered as artistically meaningful as what is written — the physical act of writing can itself be a serious craft.",
      spokenStage: "If a friend thinks handwriting can't really be 'art,' try: 'In Chinese culture, calligraphy has been considered one of the highest art forms for over 2,000 years.'",
    },
    {
      id: "cul2-aboriginal-dotpainting",
      category: "Culture & Arts",
      headline: "Paintings That Work as Both Art and Ancient Maps",
      insight: "Aboriginal Australian dot painting uses patterns of dots, often in earthy colors, to depict Dreaming stories, ancestral journeys, and knowledge about the land passed down over tens of thousands of years. Some works encode real information, like the location of waterholes or animal tracks, meaning the paintings can function as both spiritual storytelling and practical knowledge for navigating the landscape.",
      takeaway: "Art doesn't have to be purely decorative — some traditions encode real, practical knowledge inside a visual style that also carries deep cultural meaning.",
      spokenStage: "If a friend just sees dot paintings as pretty patterns, try: 'Some of them actually encode real information, like where to find waterholes, alongside the stories they tell.'",
    },
    {
      id: "gov2-parliamentary-vs-presidential",
      category: "Governance",
      headline: "Not Every Country's Leader Is Directly Elected by the Public",
      insight: "In a parliamentary system, like the UK, Japan, or India, voters typically elect members of parliament, and the leader of the majority party or coalition becomes the head of government, called a prime minister, rather than being elected separately. In a presidential system, like the United States or Brazil, voters directly elect the president as a separate office from the legislature. Both systems are common ways democracies organize their executive branch.",
      takeaway: "When comparing 'how a country picks its leader,' it matters whether you're looking at a parliamentary or presidential system, because the process can be structured completely differently.",
      spokenStage: "If a friend assumes every country votes directly for its top leader, try: 'Not really — in parliamentary systems like the UK, people vote for parliament, and the prime minister comes from whichever party wins the most seats.'",
    },
    {
      id: "gov2-federal-vs-unitary",
      category: "Governance",
      headline: "Some Countries Split Power Between National and Regional Governments",
      insight: "In a federal system, like the United States, Germany, or India, power is constitutionally divided between a national government and regional governments, such as states or provinces, each with their own specific authority. In a unitary system, like France or Japan, the national government holds most of the power, and any regional or local governments mainly carry out decisions made at the national level.",
      takeaway: "Whether a country is federal or unitary changes how much power local and regional governments actually have to make their own decisions, separate from the national government.",
      spokenStage: "If a friend asks why U.S. states can pass such different laws from each other, say: 'The U.S. is a federal system, so states are given real constitutional power separate from the national government.'",
    },
    {
      id: "gov2-constitutional-monarchy",
      category: "Governance",
      headline: "Some Countries Still Have Kings and Queens Who Don't Actually Rule",
      insight: "A constitutional monarchy is a system where a king, queen, or emperor serves as the ceremonial head of state, representing the country at official events and symbolizing national continuity, while an elected government actually makes and enforces the laws. Countries like the United Kingdom, Japan, Sweden, and Thailand all currently have constitutional monarchies, meaning the monarch's role today is largely symbolic rather than governing.",
      takeaway: "A country having a monarch doesn't necessarily mean it isn't a democracy — the real day-to-day political power can still rest entirely with elected officials.",
      spokenStage: "If a friend says having a king or queen means a country 'isn't really a democracy,' try: 'Not necessarily — in constitutional monarchies like the UK or Japan, elected governments actually run the country, and the monarch's role is mostly ceremonial.'",
    },
    {
      id: "gov2-coalition-government",
      category: "Governance",
      headline: "When No Single Party Wins, Governments Learn to Team Up",
      insight: "In many parliamentary democracies, if no single political party wins enough seats to govern on its own, two or more parties can form a coalition government, agreeing to share power and combine enough seats to pass laws together. Coalition governments are common in countries like Germany and the Netherlands, and they often require parties with different views to negotiate and compromise on policy.",
      takeaway: "A government doesn't have to be run by one party to function — coalitions show that sharing power between groups with different views is a normal, working part of many democracies.",
      spokenStage: "If a friend is confused why a country's government has multiple party leaders sharing power, say: 'That's a coalition government — it happens when no single party wins enough seats alone, so a few team up together.'",
    },
    {
      id: "gov2-bicameral-legislature",
      category: "Governance",
      headline: "Why Some Countries Make Laws Pass Through Two Separate Houses",
      insight: "A bicameral legislature is a lawmaking body split into two separate chambers, like the U.S. Congress's House of Representatives and Senate, or the UK Parliament's House of Commons and House of Lords, where a proposed law generally needs approval from both chambers before it can take effect. This structure is designed to add an extra layer of review and slow down lawmaking enough to catch problems or force broader agreement.",
      takeaway: "Requiring two separate chambers to agree isn't about making lawmaking harder for its own sake — it's a built-in check meant to encourage more careful, widely-supported decisions.",
      spokenStage: "If a friend asks why a law has to pass 'two different votes' in some countries, say: 'That's a bicameral legislature — laws usually need approval from both chambers, which forces extra review before anything passes.'",
    },
    {
      id: "gov2-referendum",
      category: "Governance",
      headline: "Sometimes a Law Is Decided by the Public Directly, Not Lawmakers",
      insight: "A referendum is a direct vote where citizens themselves decide on a specific law, policy, or constitutional change, rather than leaving the decision entirely to elected representatives. Switzerland holds referendums especially often, sometimes several times a year on various national and local issues, while other countries use them more rarely, usually for major decisions like changing a constitution.",
      takeaway: "Most laws are made by elected representatives, but referendums are a reminder that some decisions are considered important enough to put directly in front of voters instead.",
      spokenStage: "If a friend asks how citizens can vote directly on a specific law instead of through their representatives, say: 'That's called a referendum — countries like Switzerland use them regularly for major decisions.'",
    },
    {
      id: "gov2-icj-vs-icc",
      category: "Governance",
      headline: "Two Similarly-Named International Courts Do Very Different Jobs",
      insight: "The International Court of Justice (ICJ) settles legal disputes between countries, like disagreements over borders or treaties, and only countries, not individuals, can be parties in its cases. The International Criminal Court (ICC) is a separate institution that instead prosecutes individual people for serious crimes like genocide or war crimes. Both are based in The Hague, Netherlands, which leads to frequent mix-ups between them.",
      takeaway: "Similar-sounding international institutions can have completely different jobs, so it's worth checking whether an issue involves countries as parties or individuals being prosecuted before assuming which court is involved.",
      spokenStage: "If a friend mixes up the ICJ and the ICC, try: 'The ICJ handles disputes between countries, but the ICC prosecutes individual people — they're totally different courts.'",
    },
    {
      id: "gov2-independent-judiciary",
      category: "Governance",
      headline: "Why Judges in Many Countries Aren't Supposed to Answer to Politicians",
      insight: "An independent judiciary means courts and judges are structured to make legal decisions free from control or pressure by the executive or legislative branches of government, often through protections like long or lifetime terms and difficult-to-reverse appointments. This separation is meant to let judges rule based on law and evidence, even when a ruling goes against what current political leaders want.",
      takeaway: "A country's courts being separate from its politicians isn't a technicality — it's specifically designed so legal decisions aren't just decided by whoever currently holds political power.",
      spokenStage: "If a friend asks why judges can rule against the government and keep their job, say: 'That's the point of an independent judiciary — judges are protected so they can rule based on law, not political pressure.'",
    },
    {
      id: "adp2-lat-reframing",
      category: "Lateral Thinking",
      headline: "The Question You're Asking Might Be the Real Problem",
      insight: "Reframing means changing how you state a problem before you try to solve it. A problem can feel impossible simply because of how it's phrased — asking 'how do we get more parking spots' instead of 'how do we reduce the number of cars' leads to completely different solutions. Skilled problem-solvers deliberately rewrite a problem several different ways before picking one to actually solve.",
      takeaway: "When you feel stuck, try writing your problem three different ways — the fix might be hiding in the new phrasing, not in a brand-new idea.",
      spokenStage: "If a friend says 'I can't solve this,' try: \"Have you tried asking the question a different way? Sometimes the problem is how it's worded.\"",
    },
    {
      id: "adp2-lat-six-hats",
      category: "Lateral Thinking",
      headline: "Why Wearing a 'Different Hat' Can Fix a Stuck Discussion",
      insight: "The Six Thinking Hats method, invented by Edward de Bono, has a group deliberately think in one mode at a time — like 'just facts,' 'just gut feelings,' or 'just new ideas' — instead of arguing every angle at once. Switching modes on purpose stops people from tangling logic, emotion, and creativity together in one messy argument.",
      takeaway: "When a group discussion is going in circles, try separating 'let's just brainstorm' from 'let's just critique' instead of doing both at the same time.",
      spokenStage: "If a group discussion turns into a messy argument, try: \"Can we do one thing at a time — first just ideas, no criticizing yet?\"",
    },
    {
      id: "adp2-lat-functional-fixedness",
      category: "Lateral Thinking",
      headline: "Why You Might Not See That a Box Could Also Be a Shelf",
      insight: "Functional fixedness is the mental trap of only seeing an object's usual purpose. In the classic 'candle problem,' people struggle to mount a candle on a wall using only a candle, matches, and a box of tacks, because they see the box only as a tack container, not as a possible shelf. Once they realize the box itself can be used as a tool, the solution often appears almost instantly.",
      takeaway: "When you're stuck with limited materials, ask 'what else could this object be used for?' instead of only its obvious job.",
      spokenStage: "If a friend says 'I don't have the right tool,' try: \"Look at what you do have — could something ordinary do the job in a different way?\"",
    },
    {
      id: "adp2-lat-biomimicry-velcro",
      category: "Lateral Thinking",
      headline: "How Burrs Stuck to a Dog Led to an Invention",
      insight: "In 1941, engineer George de Mestral noticed burrs clinging stubbornly to his dog's fur and examined them under a microscope, discovering tiny hooks that caught on fabric loops. He copied that exact hook-and-loop structure to invent Velcro. This is analogical thinking: solving a problem by borrowing a pattern from a completely different field — in this case, nature.",
      takeaway: "When you're stuck on a problem, look for a similar pattern somewhere totally unrelated, like nature or sports, and ask what you could borrow from it.",
      spokenStage: "If a friend is stuck designing something, try: \"Has nature already solved a problem like this? Copying a pattern from somewhere else can spark a solution.\"",
    },
    {
      id: "adp2-lat-scamper",
      category: "Lateral Thinking",
      headline: "Seven Questions That Turn One Idea Into Many",
      insight: "SCAMPER is a checklist of seven prompts — Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse — that pushes you to deliberately alter an existing idea instead of starting from a blank page. Running a stuck idea through even two or three of these questions, like 'what could I remove?' or 'what could I combine it with?', often produces solutions a blank brainstorm never would.",
      takeaway: "When brainstorming feels blank, don't invent from scratch — take something that already exists and run it through Substitute, Combine, or Reverse.",
      spokenStage: "If a friend says 'I can't think of anything new,' try: \"Don't start blank — take something that already works and ask what happens if you combine or reverse it.\"",
    },
    {
      id: "adp2-lat-hidden-assumptions",
      category: "Lateral Thinking",
      headline: "The Puzzle That Only Works If You Break an Invisible Rule",
      insight: "Many 'impossible' puzzles only feel that way because solvers assume a rule that was never actually stated. The classic nine-dot puzzle — connect nine dots with four straight lines without lifting your pencil — seems unsolvable until you realize nothing said the lines had to stay inside the square. Lateral thinking often means noticing which limits are real and which ones you just assumed.",
      takeaway: "When a problem feels impossible, list every rule you're assuming, then check whether the problem actually stated that or you just imagined it.",
      spokenStage: "If a friend says a puzzle is 'impossible,' try: \"Are you sure that's an actual rule, or did we just assume it?\"",
    },
    {
      id: "adp2-lat-incubation-effect",
      category: "Lateral Thinking",
      headline: "Why Walking Away From a Problem Can Help You Solve It",
      insight: "The incubation effect is a well-documented pattern where stepping away from a hard problem, going for a walk, sleeping, or doing something unrelated, actually improves your chances of solving it. Psychologists think that while your conscious attention is elsewhere, your brain keeps loosely processing the problem in the background, often freeing you from the first, wrong approach you got stuck on.",
      takeaway: "If you've been stuck on the same problem for a while, taking a real break isn't giving up — it's often the fastest way to a new angle.",
      spokenStage: "If a friend is stuck and frustrated, try: \"Maybe stop and come back later — your brain actually keeps working on it even when you're not.\"",
    },
    {
      id: "adp2-lat-divergent-convergent",
      category: "Lateral Thinking",
      headline: "Why Judging Ideas Too Early Kills the Good Ones",
      insight: "Divergent thinking means generating as many ideas as possible without judging any of them; convergent thinking means narrowing those ideas down to the best one. Creative problem-solvers keep these two stages separate on purpose, because criticizing an idea the moment it's spoken makes people stop suggesting anything unusual, including the idea that might have actually worked.",
      takeaway: "When brainstorming with others, agree on a 'no criticizing yet' rule for the first few minutes, then switch to picking favorites afterward.",
      spokenStage: "If someone shoots down an idea instantly during brainstorming, try: \"Let's hold off on judging ideas until we have a big list first.\"",
    },
    {
      id: "adp2-gm-fixed-vs-growth",
      category: "Growth Mindset",
      headline: "Two Beliefs About Your Brain That Change How You Learn",
      insight: "Psychologist Carol Dweck found that people tend to hold one of two beliefs about ability: a 'fixed mindset,' thinking talent is a set amount you're born with, or a 'growth mindset,' thinking ability grows through effort and practice. Students with a growth mindset tend to work harder after failing, because to them a setback is a sign to try a new strategy, not proof that they're incapable.",
      takeaway: "Notice when you think 'I'm just not a math person' — that's a fixed-mindset thought, and you can consciously swap it for 'I'm not there yet.'",
      spokenStage: "If a friend says 'I'm just bad at this,' try: \"That sounds like a fixed mindset — try saying 'I'm not good at this yet' instead.\"",
    },
    {
      id: "adp2-gm-power-of-yet",
      category: "Growth Mindset",
      headline: "The Three-Letter Word That Rewires a Failure",
      insight: "Adding the word 'yet' to a statement of failure — 'I can't do this' becomes 'I can't do this yet' — changes it from a permanent verdict into a temporary status update. Research on this small language shift shows it measurably changes how students respond to setbacks, making them more likely to try a new strategy instead of giving up entirely.",
      takeaway: "The next time you catch yourself saying 'I can't,' try tacking 'yet' onto the end and notice how different it feels.",
      spokenStage: "If a friend says 'I just can't do this,' try: \"Add 'yet' to the end of that sentence — it changes the whole meaning.\"",
    },
    {
      id: "adp2-gm-neuroplasticity",
      category: "Growth Mindset",
      headline: "Your Brain Physically Rewires Itself Every Time You Practice",
      insight: "Neuroplasticity is the brain's ability to form new connections between neurons and strengthen existing ones in response to practice and learning. This isn't just a metaphor — brain scans show measurable physical changes in people who practice a skill repeatedly, like the enlarged brain region for finger control found in experienced musicians. Struggling with something new is often literally the feeling of your brain building new wiring.",
      takeaway: "When learning something feels hard and slow, that discomfort is a sign your brain is actively rewiring itself, not a sign you're bad at it.",
      spokenStage: "If a friend says 'my brain just isn't built for this,' try: \"Actually, your brain changes with practice — it's called neuroplasticity, and struggling is part of the rewiring.\"",
    },
    {
      id: "adp2-gm-effort-praise",
      category: "Growth Mindset",
      headline: "Why Being Told 'You're So Smart' Can Backfire",
      insight: "In a well-known study by Carol Dweck, students praised for being 'smart' after solving a puzzle later avoided harder puzzles and performed worse under pressure, while students praised for their effort chose harder challenges and kept improving. Praising ability made kids protective of that label, while praising process kept them focused on getting better.",
      takeaway: "When someone praises you, notice whether it's about a fixed trait ('you're so smart') or about your process ('you worked hard on that'), and try praising others' effort the same way.",
      spokenStage: "If someone says 'you're just naturally good at this,' try: \"Actually I practiced a lot — I'd rather you say that than 'smart,' it keeps me trying harder things.\"",
    },
    {
      id: "adp2-gm-deliberate-practice",
      category: "Growth Mindset",
      headline: "Why Doing Something 1,000 Times Isn't the Same as Getting Better at It",
      insight: "Deliberate practice means practicing with a specific weakness in mind, immediate feedback, and constant small adjustments, not just repeating the same task over and over. A basketball player who shoots 500 casual free throws a day improves less than one who shoots 50 free throws while a coach corrects their elbow angle each time. Repetition without feedback tends to plateau quickly.",
      takeaway: "Instead of just practicing more, practice smarter: pick one specific weak spot, get feedback on it, and adjust before repeating.",
      spokenStage: "If a friend says 'I've practiced this so much and I'm still not better,' try: \"Are you just repeating it, or actually fixing one specific mistake each time?\"",
    },
    {
      id: "adp2-gm-desirable-difficulty",
      category: "Growth Mindset",
      headline: "Why Learning Should Feel a Little Too Hard",
      insight: "'Desirable difficulty' is the finding that learning sticks best when a task is challenging enough to require real effort, not so easy it's boring and not so hard it's overwhelming. Studies on study methods, like spacing practice out over several days instead of cramming, show that the extra effort of harder retrieval actually builds a stronger memory than easy repetition does.",
      takeaway: "If a study method feels totally easy, it might not be building real skill — some productive struggle is a sign you're actually learning.",
      spokenStage: "If a friend picks the easiest way to study because 'it feels better,' try: \"Easier isn't always better — a bit of struggle usually means it's actually sticking.\"",
    },
    {
      id: "adp2-gm-grit",
      category: "Growth Mindset",
      headline: "Talent Predicts Less Than You'd Think — Sticking With It Predicts a Lot",
      insight: "Psychologist Angela Duckworth's research on 'grit,' defined as sustained passion and perseverance toward a long-term goal, found it was a stronger predictor of success in tough programs, like a military academy's demanding training, than talent or fitness scores. People with grit kept working toward the same goal for years, treating setbacks as expected bumps rather than reasons to switch goals entirely.",
      takeaway: "Long-term consistency toward one goal often matters more than raw natural talent, so don't abandon a goal just because early progress feels slow.",
      spokenStage: "If a friend feels behind someone more 'naturally talented,' try: \"Talent isn't the biggest factor long-term — sticking with it consistently usually matters more.\"",
    },
    {
      id: "adp2-gm-learning-plateaus",
      category: "Growth Mindset",
      headline: "Why Getting Better Doesn't Look Like a Straight Line",
      insight: "Skill growth usually follows a bumpy curve, not a straight upward line: long flat stretches called plateaus, occasional dips where you temporarily seem worse while unlearning a bad habit, and sudden jumps in ability. This happens because your brain is often quietly consolidating smaller improvements below the surface before a skill visibly 'clicks.'",
      takeaway: "If your progress looks flat or you feel like you're temporarily getting worse, that's a normal part of the learning curve, not proof you've stopped improving.",
      spokenStage: "If a friend gets discouraged because 'I'm not improving,' try: \"Progress isn't a straight line — plateaus and even small dips are normal before the next jump.\"",
    },
    {
      id: "adp2-dm-sunk-cost",
      category: "Decision-Making",
      headline: "Why Finishing a Bad Movie Isn't 'Saving' Your Time",
      insight: "The sunk cost fallacy is the tendency to keep investing in something, time, money, or effort, just because you've already invested in it, even when quitting would clearly be the smarter choice. The time or money already spent is gone either way, it can't be un-spent, so a good decision should only weigh what happens from this point forward.",
      takeaway: "Before continuing something just because you've already put a lot into it, ask 'if I were starting fresh right now, would I still choose this?'",
      spokenStage: "If a friend says 'I've already spent so much time on this, I can't stop now,' try: \"That time is already spent either way — the real question is what's the best choice going forward.\"",
    },
    {
      id: "adp2-dm-confirmation-bias",
      category: "Decision-Making",
      headline: "Why You Notice Evidence That Agrees With You",
      insight: "Confirmation bias is the tendency to search for, notice, and remember information that supports what you already believe, while overlooking evidence that contradicts it. It happens automatically and unconsciously, which is what makes it so hard to catch — someone convinced a certain team will win tends to remember the games that prove it and forget the ones that don't.",
      takeaway: "Before settling on a belief, deliberately search for one solid piece of evidence against it, not just more evidence for it.",
      spokenStage: "If a friend only brings up facts that support their opinion, try: \"That might be confirmation bias — what's the strongest evidence against your idea?\"",
    },
    {
      id: "adp2-dm-opportunity-cost",
      category: "Decision-Making",
      headline: "Every Choice Secretly Costs You the Choice You Didn't Make",
      insight: "Opportunity cost is the value of the next-best option you give up when you choose something else. Spending an hour scrolling your phone doesn't just cost that hour, it costs whatever else you could have done with it, like practicing an instrument or finishing homework early. Every decision has this hidden cost, even when no money changes hands.",
      takeaway: "Before choosing how to spend time or money, ask 'what's the next-best thing I'm giving up by doing this instead?'",
      spokenStage: "If a friend says an activity is 'free' because it doesn't cost money, try: \"It still costs something — it costs whatever else you could've done with that time.\"",
    },
    {
      id: "adp2-dm-satisficing",
      category: "Decision-Making",
      headline: "Why 'Good Enough, Fast' Often Beats 'Perfect, Slow'",
      insight: "Economist Herbert Simon coined 'satisficing,' a blend of 'satisfy' and 'suffice,' to describe choosing the first option that meets your minimum requirements, instead of exhaustively comparing every possible option to find the absolute best one. That exhaustive approach can produce a slightly better result, but it costs far more time and often leads to more regret and second-guessing afterward.",
      takeaway: "For low-stakes decisions, set a 'good enough' bar in advance and pick the first option that clears it, instead of endlessly comparing every choice.",
      spokenStage: "If a friend is stuck comparing twenty options for something small, try: \"You don't need the perfect one — just pick the first one that's good enough and move on.\"",
    },
    {
      id: "adp2-dm-premortem",
      category: "Decision-Making",
      headline: "Imagining Failure Before You Start Can Help Prevent It",
      insight: "A pre-mortem is a planning technique where a team imagines their project has already failed, then works backward to list every reason it might have gone wrong, before the project even begins. Unlike a normal risk discussion, imagining failure as already-real makes people more willing to voice doubts they'd otherwise hold back, surfacing risks early enough to actually fix them.",
      takeaway: "Before starting something important, spend five minutes imagining it failed and listing why, then address the most likely reasons in advance.",
      spokenStage: "If a friend is about to start a big project without a plan, try: \"Let's imagine it already failed — what would be the reason? Let's fix that now.\"",
    },
    {
      id: "adp2-dm-decision-fatigue",
      category: "Decision-Making",
      headline: "Why Your 50th Decision of the Day Is Worse Than Your 5th",
      insight: "Decision fatigue is the decline in the quality of your choices after making many decisions in a row, your brain's capacity for carefully weighing options gradually wears down like a tired muscle. A well-known study of judges' parole rulings found favorable decisions were noticeably more common right after a break than right before one, suggesting mental fatigue was quietly shaping outcomes.",
      takeaway: "Save your most important decisions for earlier in the day or right after a break, and try to reduce the number of small, low-stakes choices you make beforehand.",
      spokenStage: "If a friend is struggling to decide something small late in an exhausting day, try: \"That might just be decision fatigue talking — maybe sleep on it and decide fresh tomorrow.\"",
    },
    {
      id: "adp2-dm-loss-aversion",
      category: "Decision-Making",
      headline: "Why Losing Something Hurts More Than Gaining It Feels Good",
      insight: "Loss aversion is the finding that people feel the pain of losing something roughly twice as strongly as they feel the pleasure of gaining that same thing. This is why people often make overly cautious choices to avoid a possible loss, even when the potential gain is objectively larger, because the fear of losing looms bigger in the mind than the appeal of winning.",
      takeaway: "When you're avoiding a choice purely out of fear of loss, check whether that fear is bigger than the actual potential downside, and weigh the real numbers instead of the feeling.",
      spokenStage: "If a friend won't take a reasonable risk because 'what if I lose,' try: \"That's loss aversion — losses just feel bigger than they actually are, so look at the real odds.\"",
    },
    {
      id: "adp2-dm-choice-overload",
      category: "Decision-Making",
      headline: "Why More Options Can Make You Less Happy With Your Choice",
      insight: "Choice overload, sometimes called the paradox of choice, is the finding that too many options can make decisions harder, not easier, and can leave people less satisfied with whatever they end up picking. A famous supermarket study found shoppers were far more likely to actually buy jam when offered 6 varieties than when offered 24, more choices increased browsing but decreased actual decisions and confidence.",
      takeaway: "When a decision feels overwhelming because of too many options, narrow it down to just two or three finalists before choosing.",
      spokenStage: "If a friend is frozen trying to pick from a huge menu or list, try: \"Too many options actually makes it harder — just narrow it to your top three first.\"",
    },
    {
      id: "adp2-sys-second-order-thinking",
      category: "Systems Thinking",
      headline: "The Effect of the Effect Is Where the Real Consequences Hide",
      insight: "First-order thinking stops at the immediate, obvious result of a decision; second-order thinking asks 'and then what happens because of that?' A city might add a highway lane to reduce traffic, an obvious first-order effect, but more drivers are then drawn onto the easier road, which fills the new lane right back up, a second-order effect called induced demand.",
      takeaway: "Before deciding something looks like a good fix, ask 'what happens next, because of this fix?' at least one more step forward.",
      spokenStage: "If a friend thinks a quick fix obviously solves a problem, try: \"Okay, but then what happens because of that? Let's think one step further.\"",
    },
    {
      id: "adp2-sys-emergence",
      category: "Systems Thinking",
      headline: "Why a Whole System Can Do Things No Single Part Can",
      insight: "Emergence is when a system as a whole displays behavior or properties that none of its individual parts have on their own. A single ant knows almost nothing, but a colony of ants can build complex nests and find efficient paths to food, patterns that emerge purely from thousands of ants following a few simple local rules with no ant actually in charge.",
      takeaway: "When trying to understand a complex group or system, don't just study one part in isolation, look at how the parts interact, since the interesting behavior often only shows up at the group level.",
      spokenStage: "If a friend tries to understand a team by studying just one player, try: \"The interesting stuff might come from how they interact, not just any one player alone.\"",
    },
    {
      id: "adp2-sys-theory-of-constraints",
      category: "Systems Thinking",
      headline: "Your Slowest Step Decides Your Whole Team's Speed",
      insight: "In any process with multiple steps, the theory of constraints says the entire system's output is limited by its single slowest step, called the bottleneck, no matter how fast the other steps run. Speeding up steps that aren't the bottleneck does almost nothing for the whole system, only fixing the actual bottleneck increases overall output.",
      takeaway: "When trying to speed up a group project or process, find the single slowest step first, improving anything else is often wasted effort.",
      spokenStage: "If a friend wants to speed up every part of a group project at once, try: \"Find the slowest step first — fixing the other parts won't help until that one's faster.\"",
    },
    {
      id: "adp2-sys-cobra-effect",
      category: "Systems Thinking",
      headline: "The Reward That Made a Problem Worse, Not Better",
      insight: "The 'cobra effect' comes from a famous story from colonial India: officials offered a cash bounty for every dead cobra to reduce the snake population, so people began breeding cobras just to kill them for money. When the bounty was cancelled, breeders released their now-worthless cobras, leaving the wild population larger than before the program started. It's now a shorthand for any fix that creates incentives leading to the opposite of the intended result.",
      takeaway: "Before setting up a reward or rule to fix a problem, ask 'what new behavior would someone invent to get this reward the easy way?'",
      spokenStage: "If a friend designs a rule or reward system for something, try: \"What's the sneaky way someone could game this reward without actually fixing the problem?\"",
    },
    {
      id: "adp2-sys-stock-and-flow",
      category: "Systems Thinking",
      headline: "Think of Any System Like a Bathtub With a Faucet and a Drain",
      insight: "In systems thinking, a 'stock' is any quantity that builds up, like water in a bathtub, savings in a bank account, or trust in a friendship, while 'flows' are the rates that add to it or drain it. A stock only grows if the inflow rate is bigger than the outflow rate, which is why small, steady flows can build up a surprisingly large stock over time.",
      takeaway: "To change a stock you care about, like your savings or your skill level, focus on adjusting the inflow and outflow rates, not just staring at the current total.",
      spokenStage: "If a friend feels like their savings or skill level 'just isn't growing,' try: \"Think of it like a bathtub — is more going in than out? Adjust the flow, not just the total.\"",
    },
    {
      id: "adp2-sys-pareto-principle",
      category: "Systems Thinking",
      headline: "Why a Small Slice of Your Effort Usually Produces Most of Your Results",
      insight: "The Pareto principle, named after economist Vilfredo Pareto who noticed roughly 80% of Italy's land was owned by 20% of the population, describes a pattern that shows up across many systems: a small portion of causes often accounts for a large majority of the effects. In studying, this might mean a small fraction of topics account for most of the exam questions, so identifying that fraction is often more valuable than studying everything equally.",
      takeaway: "Before spreading your effort evenly across everything, ask which smaller portion of the work is likely producing most of the results, and focus there first.",
      spokenStage: "If a friend is studying every topic equally under time pressure, try: \"A small chunk of topics probably covers most of the test — find that chunk first.\"",
    },
    {
      id: "adp2-sys-five-whys",
      category: "Systems Thinking",
      headline: "Ask 'Why' Five Times to Find the Real Problem",
      insight: "The Five Whys technique, developed at Toyota, means repeatedly asking 'why did that happen?' about a problem, using each answer to dig one level deeper, until you reach the actual root cause instead of just a surface symptom. A car won't start (why? dead battery — why? alternator failed — why? belt broke — why? it was never replaced on schedule) reveals a maintenance-scheduling problem, not just 'the battery,' as the real fix needed.",
      takeaway: "When something goes wrong, resist fixing the first cause you find, ask 'why' a few more times to see if there's a deeper root cause behind it.",
      spokenStage: "If a friend wants to fix only the surface problem, try: \"Let's ask 'why' a few more times — the real cause might be a step deeper.\"",
    },
    {
      id: "adp2-sys-tragedy-of-commons",
      category: "Systems Thinking",
      headline: "Why a Resource Everyone Shares Can Vanish for Everyone",
      insight: "The 'tragedy of the commons' describes what happens when a shared resource, like a public pasture, a fishing area, or even a group snack bowl, is available to everyone but owned by no one: each person benefits from using a bit more, but the cost of overuse is spread across everyone, so the resource gets used up faster than it can renew. It only works out when the whole group agrees to limits, or someone manages the resource on everyone's behalf.",
      takeaway: "In any shared resource, don't just ask 'what's best for me to take,' ask 'what happens if everyone thinks the way I'm thinking right now?'",
      spokenStage: "If a friend group is fighting over shared snacks or supplies running out fast, try: \"That's the tragedy of the commons — we need an actual limit, or it disappears for everyone.\"",
    },
    {
      id: "adp2-pr-base-rate-neglect",
      category: "Probability & Reasoning",
      headline: "Why a 'Positive' Test Result Might Still Mean You're Fine",
      insight: "Base rate neglect is the mistake of ignoring how common or rare something is in the first place when judging a probability. If a disease affects only 1 in 1,000 people and a test is 99% accurate, most people assume a positive result almost certainly means you're sick, but because so many more healthy people take the test than sick people, a real chunk of positive results still turn out to be false alarms from that huge healthy group.",
      takeaway: "When judging how likely something is, always ask 'how rare or common is this to begin with?' before trusting a single piece of evidence.",
      spokenStage: "If a friend panics over one alarming test result or headline stat, try: \"How common is this in general? A rare condition can still cause false alarms even with an accurate test.\"",
    },
    {
      id: "adp2-pr-availability-heuristic",
      category: "Probability & Reasoning",
      headline: "Why Rare Dangers Can Feel More Common Than They Are",
      insight: "The availability heuristic is the tendency to judge how likely something is based on how easily examples come to mind, rather than actual statistics. Dramatic events like plane crashes get intense news coverage and stick vividly in memory, so people often overestimate how dangerous flying is, even though car travel is statistically far more dangerous per mile but rarely makes headlines.",
      takeaway: "When something feels scary or common because you can easily picture examples, check actual numbers before trusting that gut feeling of risk.",
      spokenStage: "If a friend says something is 'so common' just because they can think of examples, try: \"That might be the availability heuristic — memorable isn't the same as likely.\"",
    },
    {
      id: "adp2-pr-survivorship-bias",
      category: "Probability & Reasoning",
      headline: "You Only Hear From the Ones Who Made It",
      insight: "Survivorship bias is the error of only looking at the people or things that 'survived' some process while ignoring everyone who didn't, which skews conclusions. During World War Two, engineers almost reinforced returning bomber planes only where bullet holes were found, until a statistician pointed out those were the planes that survived being hit there, the real danger spots were where the planes that never made it back had been hit.",
      takeaway: "When studying 'successful' examples for lessons, remember to also ask about all the failures you're not seeing, since the full picture includes them too.",
      spokenStage: "If a friend says 'just copy what successful people did,' try: \"That's survivorship bias — we should also check what people who failed did the same thing.\"",
    },
    {
      id: "adp2-pr-correlation-causation",
      category: "Probability & Reasoning",
      headline: "Just Because Two Things Happen Together Doesn't Mean One Caused the Other",
      insight: "Correlation means two things tend to happen together or change together; causation means one thing actually makes the other happen. Ice cream sales and drowning deaths both rise in summer, but ice cream doesn't cause drowning, a hidden third factor, hot weather and more swimming, is driving both at once. Mixing these up leads to confidently wrong conclusions.",
      takeaway: "When you notice two things happening together, ask 'could something else be causing both of these?' before assuming one caused the other.",
      spokenStage: "If a friend says 'X causes Y' just because they happen together, try: \"That's correlation, not necessarily causation — could something else explain both?\"",
    },
    {
      id: "adp2-pr-occams-razor",
      category: "Probability & Reasoning",
      headline: "When in Doubt, Bet on the Simpler Explanation",
      insight: "Occam's razor is a reasoning principle stating that, among competing explanations that all fit the evidence equally well, the one requiring the fewest assumptions is usually the best one to start with. It doesn't mean the simplest explanation is always true, complicated things do happen, but it means you shouldn't reach for an elaborate explanation when a simple one already covers all the facts.",
      takeaway: "Before jumping to a complicated or dramatic explanation, check whether a simpler one already accounts for everything you've observed.",
      spokenStage: "If a friend comes up with an elaborate theory for something ordinary, try: \"What's the simplest explanation that still fits all the facts? Start there.\"",
    },
    {
      id: "adp2-pr-regression-to-mean",
      category: "Probability & Reasoning",
      headline: "Why an Amazing Performance Is Usually Followed by an Average One",
      insight: "Regression to the mean is the statistical pattern where an unusually extreme result, great or terrible, tends to be followed by a result closer to average, simply because extreme results are partly due to luck that doesn't repeat. An athlete who has a career-best game one week is likely to play closer to their normal average the next, not because they got worse, but because the earlier game's luck wasn't guaranteed to strike twice.",
      takeaway: "Don't assume a single amazing or terrible result reveals someone's true new normal, wait for several results before judging a real change in ability.",
      spokenStage: "If a friend assumes one great or terrible game proves a permanent change, try: \"That might just be regression to the mean — let's see a few more results before deciding.\"",
    },
    {
      id: "adp2-pr-law-of-large-numbers",
      category: "Probability & Reasoning",
      headline: "Why Flipping a Coin 10 Times Looks Weird but 10,000 Times Doesn't",
      insight: "The law of large numbers says that as you repeat a random event more and more times, the overall results get closer and closer to the true expected probability, even though small samples can look wildly uneven. Flipping a coin 10 times might easily land 7 heads and 3 tails, but flip it 10,000 times and the split will almost certainly land very close to 50-50.",
      takeaway: "Don't trust a small number of trials to reveal the 'true' odds of something, small samples are naturally noisy, and only larger samples reliably settle toward the real probability.",
      spokenStage: "If a friend judges odds off of just a few tries, try: \"Small samples are noisy — the real probability only shows up clearly over a lot more tries.\"",
    },
    {
      id: "adp2-pr-selection-bias",
      category: "Probability & Reasoning",
      headline: "Why an Online Poll Can Get the Whole Group Wrong",
      insight: "Selection bias happens when the group you gather data from isn't actually representative of the group you're trying to understand, which skews the conclusion before you even start analyzing it. An online poll about a topic mostly reaches people who already care enough to click on it, so its results can look totally different from what the broader population actually thinks.",
      takeaway: "Before trusting a survey or poll's results, ask who exactly was included and left out, since who was asked can matter as much as what was asked.",
      spokenStage: "If a friend cites an online poll as proof 'everyone thinks X,' try: \"Who actually took that poll, though? It might not represent everyone.\"",
    },
    {
      id: "sat2-predict-your-own-word",
      category: "SAT Vocabulary",
      headline: "Cover the Answers and Guess the Word Yourself First",
      insight: "Before looking at the answer choices on a Words in Context question, read the sentence and come up with your own word or phrase that fits the blank based on the clues around it. This keeps you anchored to what the sentence actually means instead of getting talked into a fancy-sounding answer choice that doesn't quite fit.",
      takeaway: "Predicting your own word first turns the question into 'which choice matches my word' instead of 'which choice sounds smart,' and that's a much easier comparison to make.",
      spokenStage: "If a friend says they just scan the answer choices right away, try: \"Cover them up first — guess your own word from the sentence, then see which choice matches it.\"",
    },
    {
      id: "sat2-connotation-charge-trap",
      category: "SAT Vocabulary",
      headline: "Same Meaning, Different Vibe: Watch a Word's 'Charge'",
      insight: "Many wrong answers on Words in Context questions are technically close in meaning to the right word but carry the wrong connotation — the positive or negative feeling attached to it. For example, 'frugal' and 'stingy' both describe someone who doesn't spend much money, but 'frugal' sounds like a compliment while 'stingy' sounds like an insult.",
      takeaway: "Don't just ask 'does this word mean something similar?' Ask 'does this word carry the same positive or negative feeling as the passage does?'",
      spokenStage: "If someone picks a synonym that technically fits, say: \"Check the vibe too — some synonyms have a totally different connotation than what the sentence needs.\"",
    },
    {
      id: "sat2-roots-prefixes-clue",
      category: "SAT Vocabulary",
      headline: "Break Down Unfamiliar Words Using Roots and Prefixes",
      insight: "When a word is completely unfamiliar, breaking it into pieces can give you a strong hint: 'bene-' means good (benevolent, beneficial), 'mal-' means bad (malfunction, malicious), and '-ology' means the study of something. This won't work for every word, since English has plenty of exceptions, so always double-check your guess against the actual sentence.",
      takeaway: "Use roots and prefixes as a backup clue when context alone isn't enough, not as your only tool.",
      spokenStage: "If a friend gets stuck on a word like 'malnourished,' try: \"Think about the pieces — 'mal' means bad, so it's probably something like 'poorly fed.'\"",
    },
    {
      id: "sat2-appositive-definition",
      category: "SAT Vocabulary",
      headline: "Commas Can Secretly Define the Word for You",
      insight: "Sometimes a sentence sets off a phrase in commas right next to the tricky word, and that phrase is basically a definition or example in disguise. This is called an appositive, and on Words in Context questions it can hand you the meaning almost directly if you know to look for it.",
      takeaway: "When you spot a comma-separated phrase right after an unfamiliar word, check whether it's quietly explaining what that word means.",
      spokenStage: "If a friend is stuck on a hard word, say: \"Look right after it — is there a phrase set off by commas that's basically explaining it?\"",
    },
    {
      id: "sat2-register-formality-match",
      category: "SAT Vocabulary",
      headline: "Formal Passages Need Formal Words, Not Just Close Synonyms",
      insight: "Digital SAT passages are often written in a formal, academic tone, and the right answer usually matches that register. A casual word that technically means the same thing as a formal one — like 'okay' instead of 'satisfactory' — can still be the wrong choice because it clashes with the passage's voice.",
      takeaway: "When two choices seem to mean almost the same thing, pick the one that sounds like it belongs in the rest of the passage.",
      spokenStage: "If someone picks a choice that feels too casual, try: \"That means the same thing, but it doesn't match the formal tone of the passage — that's probably why it's wrong.\"",
    },
    {
      id: "sat2-paraphrase-before-choosing",
      category: "SAT Vocabulary",
      headline: "Restate the Clue Sentence in Your Own Words First",
      insight: "Before choosing an answer, try summarizing the sentence containing the blank in simple, everyday language. Turning 'Her taciturn demeanor unsettled her new coworkers' into 'she didn't talk much, and that felt weird to them' makes it much easier to spot which answer choice actually fits.",
      takeaway: "If you can't explain the sentence simply, you probably don't have a clear enough grip on it yet to trust your answer choice.",
      spokenStage: "If a friend picks an answer too fast, ask: \"Can you say what that sentence means in your own words first? If not, slow down.\"",
    },
    {
      id: "sat2-multiple-meaning-words",
      category: "SAT Vocabulary",
      headline: "The Same Word Can Mean Totally Different Things",
      insight: "Words like 'produce,' 'content,' and 'novel' change meaning depending on how they're used — 'produce' can mean fruits and vegetables (noun) or to make something (verb), and 'content' can mean what's inside something (noun) or feeling satisfied (adjective). On Words in Context questions, check how the word is functioning in the sentence, not just what it usually means to you.",
      takeaway: "Before locking in an answer, notice whether the blank needs a noun, verb, or adjective — that alone can rule out choices that use the 'wrong' meaning of a word.",
      spokenStage: "If a friend gets confused by a word like 'content,' say: \"Check if it's being used as a noun or an adjective here — that changes what it means.\"",
    },
    {
      id: "sat2-intensity-mismatch-trap",
      category: "SAT Vocabulary",
      headline: "Watch for Answer Choices That Are Too Extreme",
      insight: "Sometimes an answer choice is in the right ballpark of meaning but is way stronger or weaker than what the passage actually describes. If the passage describes someone as mildly annoyed, an answer choice meaning 'furious' is too intense to be correct, even though both relate to anger.",
      takeaway: "Match not just the type of feeling or idea, but also its intensity, to what the passage actually supports.",
      spokenStage: "If a friend picks a word that seems way too strong, ask: \"Does the passage actually support something that intense, or just a milder version of it?\"",
    },
    {
      id: "sat2-redundant-choice-trap",
      category: "SAT Vocabulary",
      headline: "The Right Word Adds Meaning — It Doesn't Just Repeat It",
      insight: "A tempting wrong answer sometimes just restates information the sentence already gave you, instead of logically completing the sentence's idea. The correct choice should connect logically to the context clues, not simply echo a word or idea that's already there.",
      takeaway: "If an answer choice feels like it's just repeating what you already know from the sentence, check whether it's actually doing the logical job the blank needs.",
      spokenStage: "If someone picks a choice that just restates the sentence, say: \"That's not wrong exactly, but does it actually complete the logic, or just repeat it?\"",
    },
    {
      id: "sat2-subject-verb-interrupter",
      category: "SAT Grammar",
      headline: "Don't Let the Word Right Before the Verb Fool You",
      insight: "When a prepositional phrase sits between the subject and the verb, the verb still has to agree with the main subject, not the noun closest to it. In 'The list of ingredients is long,' the subject is 'list' (singular), so the verb is 'is,' even though 'ingredients' is plural and sits right next to the verb.",
      takeaway: "When you're checking subject-verb agreement, mentally cross out the prepositional phrase in the middle and see what the sentence sounds like without it.",
      spokenStage: "If a friend picks 'are' for a sentence like 'the list of ingredients ___ long,' say: \"Cross out 'of ingredients' — the real subject is 'list,' so it needs 'is.'\"",
    },
    {
      id: "sat2-parallel-structure-lists",
      category: "SAT Grammar",
      headline: "Items in a List Have to Match Grammatically",
      insight: "When a sentence lists or compares multiple things joined by 'and' or 'or,' each item needs to be in the same grammatical form. 'She enjoys hiking, swimming, and to read' is wrong because 'to read' breaks the pattern set by 'hiking' and 'swimming' — it should be 'reading.'",
      takeaway: "When you see a list or comparison in a sentence, check that every item uses the same form (all -ing words, all infinitives, all nouns, etc.).",
      spokenStage: "If a friend writes 'I like running, biking, and to swim,' say: \"Those need to match — it should be 'running, biking, and swimming.'\"",
    },
    {
      id: "sat2-apostrophe-its-vs-possessive",
      category: "SAT Grammar",
      headline: "Its vs. It's: One Letter That Trips Up Everyone",
      insight: "'It's' is always a contraction meaning 'it is' or 'it has,' while 'its' with no apostrophe shows possession, like 'his' or 'her.' This breaks the usual rule that apostrophes show ownership, which is exactly why it's such a common trap on the SAT.",
      takeaway: "If you can replace the word with 'it is' and the sentence still makes sense, use 'it's'; otherwise, use 'its.'",
      spokenStage: "If a friend writes 'the dog wagged it's tail,' say: \"Try swapping in 'it is' — 'it is tail' doesn't work, so you need 'its' with no apostrophe.\"",
    },
    {
      id: "sat2-who-vs-whom",
      category: "SAT Grammar",
      headline: "Who or Whom? Swap in 'He' or 'Him' to Check",
      insight: "'Who' acts as the subject of a sentence (the one doing the action), like 'he' or 'she,' while 'whom' acts as the object (the one receiving the action), like 'him' or 'her.' A quick trick: if you could answer the question with 'he,' use 'who'; if you'd answer with 'him,' use 'whom.'",
      takeaway: "When you're stuck between who and whom, mentally rephrase the sentence as a statement using he or him and let that tell you which one fits.",
      spokenStage: "If a friend asks 'who/whom did you give it to,' say: \"Try 'you gave it to him' — since it's 'him,' the answer is 'whom.'\"",
    },
    {
      id: "sat2-semicolon-independent-clauses",
      category: "SAT Grammar",
      headline: "A Semicolon Needs a Complete Sentence on Both Sides",
      insight: "A semicolon can join two independent clauses — meaning each half could stand alone as its own complete sentence — without needing a conjunction like 'and' or 'but.' If either side of the semicolon couldn't work as a standalone sentence, the semicolon is being used incorrectly.",
      takeaway: "Before trusting a semicolon in an answer choice, test both halves separately — if either one isn't a complete sentence on its own, that choice is wrong.",
      spokenStage: "If a friend isn't sure a semicolon is used correctly, say: \"Check both sides — could each one be its own full sentence? If not, the semicolon's wrong.\"",
    },
    {
      id: "sat2-colon-after-complete-sentence",
      category: "SAT Grammar",
      headline: "A Colon Only Works After a Complete Sentence",
      insight: "A colon is used to introduce a list, explanation, or example, but the part right before the colon must be a complete, independent clause. 'My favorite subjects are: math and science' is actually incorrect because 'my favorite subjects are' isn't a complete sentence on its own — it needs something like 'I have two favorite subjects: math and science.'",
      takeaway: "Before you trust a colon in a sentence, check whether everything before it could stand alone as its own full sentence.",
      spokenStage: "If a friend writes 'the ingredients are: flour, sugar, and eggs,' say: \"That colon's not set up right — try 'the recipe needs three ingredients: flour, sugar, and eggs.'\"",
    },
    {
      id: "sat2-modifier-placement",
      category: "SAT Grammar",
      headline: "A Descriptive Phrase Needs to Sit Next to What It Describes",
      insight: "When a sentence opens with a descriptive phrase, the noun right after the comma must be the thing that phrase is actually describing. 'Running down the street, the bus was missed by Sam' incorrectly suggests the bus was running, when it should be 'Running down the street, Sam missed the bus.'",
      takeaway: "Whenever a sentence opens with a descriptive phrase followed by a comma, check that the very next word is the person or thing actually being described.",
      spokenStage: "If a friend writes 'Excited for the trip, the bags were packed by Maria,' say: \"That says the bags were excited — it should be 'Excited for the trip, Maria packed the bags.'\"",
    },
    {
      id: "sat2-essential-nonessential-commas",
      category: "SAT Grammar",
      headline: "Extra Information Gets Commas — Essential Information Doesn't",
      insight: "If a phrase in a sentence could be removed without losing the sentence's core meaning, it's 'nonessential' and needs commas around it. But if the phrase is necessary to understand which specific thing is being talked about, it's 'essential' and should NOT have commas.",
      takeaway: "Try mentally deleting the phrase in question — if the sentence still clearly means the same core thing, it needs commas; if the meaning becomes unclear, it doesn't.",
      spokenStage: "If a friend isn't sure whether to add commas around a phrase, ask: \"If you deleted that phrase, would the sentence still make total sense? If yes, it needs commas.\"",
    },
    {
      id: "sat2-pronoun-antecedent-agreement",
      category: "SAT Grammar",
      headline: "A Pronoun Has to Clearly Match One Specific Noun",
      insight: "Every pronoun (like 'it,' 'they,' or 'this') needs a clear antecedent — the specific noun it's replacing — and it has to match that noun in number, singular or plural. If a sentence mentions two possible nouns a pronoun could be referring to, or if 'they' is used for a singular noun without a clear match, the sentence has a pronoun error.",
      takeaway: "When you see a pronoun in a sentence, trace it back to exactly one noun — if it's ambiguous or mismatched in number, that's an error worth flagging.",
      spokenStage: "If a friend writes a sentence where 'it' could mean two different things, say: \"That pronoun's unclear — which noun is it actually supposed to replace?\"",
    },
    {
      id: "sat2-systems-no-solution-infinite",
      category: "SAT Math",
      headline: "How to Tell a System of Equations Has No Solution (Without Graphing)",
      insight: "For two linear equations, compare the ratio of their x-coefficients, y-coefficients, and constants. If the coefficient ratios match each other but don't match the constant ratio, the lines are parallel and the system has no solution; if all three ratios match, the equations describe the exact same line, giving infinite solutions.",
      takeaway: "You can predict whether a system has one solution, no solution, or infinite solutions just by comparing coefficient ratios — no graphing or solving required.",
      spokenStage: "If a friend asks why a system has no solution, say: \"Compare the coefficient ratios — if the x and y ratios match but the constant doesn't, the lines are parallel and never meet.\"",
    },
    {
      id: "sat2-exponent-rules-basics",
      category: "SAT Math",
      headline: "Three Exponent Rules That Cover Most SAT Questions",
      insight: "When multiplying powers with the same base, add the exponents (a^m × a^n = a^(m+n)). When raising a power to another power, multiply the exponents ((a^m)^n = a^(mn)). And a negative exponent means 'take the reciprocal' (a^-n = 1/a^n), not that the value itself becomes negative.",
      takeaway: "Most exponent questions are really just these three rules in disguise — memorize them cold so you can apply them instantly instead of re-deriving them under time pressure.",
      spokenStage: "If a friend thinks a negative exponent makes a number negative, say: \"It doesn't — a negative exponent just means flip it into a fraction, like 2^-2 is 1/4.\"",
    },
    {
      id: "sat2-function-shift-transformations",
      category: "SAT Math",
      headline: "How Adding Numbers Inside vs. Outside a Function Moves Its Graph",
      insight: "For a function written as f(x - h) + k, the graph of f(x) shifts right by h and up by k. Numbers added or subtracted outside the parentheses move the graph vertically, while numbers inside the parentheses move it horizontally — and horizontal shifts work in the opposite direction you might expect.",
      takeaway: "When you see f(x - 3), don't assume it shifts left just because of the minus sign — subtracting inside the parentheses actually shifts the graph right.",
      spokenStage: "If a friend thinks f(x - 3) shifts a graph left, say: \"Actually the opposite — subtracting inside the parentheses shifts it right by 3.\"",
    },
    {
      id: "sat2-slope-intercept-word-problems",
      category: "SAT Math",
      headline: "In Word Problems, Slope and Y-Intercept Tell a Story",
      insight: "When a real-world situation is modeled by y = mx + b, the slope (m) represents the rate of change — like cost per item or speed per hour — and the y-intercept (b) represents the starting value before that rate kicks in, like a flat fee or an initial amount. Spotting which number in a word problem is the 'per unit' rate versus the fixed starting amount tells you exactly which one is the slope and which is the intercept.",
      takeaway: "Before writing an equation for a word problem, ask 'what's the starting amount?' (that's b) and 'what changes per unit?' (that's m).",
      spokenStage: "If a friend is stuck turning a word problem into an equation, ask: \"What's the flat starting cost, and what's the cost that changes per item? Those are your b and your m.\"",
    },
    {
      id: "sat2-mean-vs-median-outliers",
      category: "SAT Math",
      headline: "Why One Big Outlier Can Wreck the Mean but Not the Median",
      insight: "The mean (average) is calculated using every value in a data set, so one extremely high or low number can pull it far away from where most of the data actually sits. The median, the middle value when data is sorted in order, only cares about position, so it barely budges when a single outlier is added.",
      takeaway: "When a data set has an outlier, expect the mean and median to disagree — and remember the median is usually the more 'typical' representative value in that case.",
      spokenStage: "If a friend asks why the average salary at a company seems way higher than what most people earn, say: \"One huge outlier — like the CEO's salary — pulls the mean way up, but the median wouldn't move nearly as much.\"",
    },
    {
      id: "sat2-circle-equation-center-radius",
      category: "SAT Math",
      headline: "The Circle Equation Hides the Center and Radius in Plain Sight",
      insight: "A circle's equation in the form (x - h)^2 + (y - k)^2 = r^2 directly tells you its center, (h, k), and its radius, r. Watch the signs carefully: an equation like (x - 3)^2 + (y + 2)^2 = 25 means the center is at (3, -2), not (-3, 2), and the radius is 5, not 25.",
      takeaway: "Always flip the sign inside the parentheses to find the center coordinates, and remember to take the square root of the number on the right to get the actual radius.",
      spokenStage: "If a friend says the radius in (x-1)^2+(y-4)^2=16 is 16, say: \"That's r squared — take the square root, so the radius is actually 4.\"",
    },
    {
      id: "sat2-percent-change-compounding",
      category: "SAT Math",
      headline: "Why a 10% Increase Then a 10% Decrease Doesn't Cancel Out",
      insight: "Percent changes are calculated based on the current value, not the original one, so applying a 10% increase and then a 10% decrease doesn't bring you back to where you started. A $100 item that increases 10% becomes $110, but a 10% decrease off of $110 is only $99 — not back to $100.",
      takeaway: "Whenever a problem involves two or more percent changes in a row, recalculate the percentage off the new value each time instead of just adding or subtracting the percentages together.",
      spokenStage: "If a friend thinks a 20% increase followed by a 20% decrease gets back to the original number, say: \"It doesn't — the second percent is taken from the new, bigger number, so you actually end up lower.\"",
    },
    {
      id: "sat2-special-right-triangles",
      category: "SAT Math",
      headline: "Two Triangle Ratios Worth Memorizing Cold",
      insight: "In a 45-45-90 triangle, the two legs are equal and the hypotenuse is a leg times the square root of 2. In a 30-60-90 triangle, the sides are always in the ratio 1 : square root of 3 : 2, with the shortest side opposite the 30-degree angle and the longest side (the hypotenuse) opposite the 90-degree angle.",
      takeaway: "Recognizing these two ratios instantly can save you from doing full Pythagorean theorem calculations on questions that are really just testing whether you know the shortcut.",
      spokenStage: "If a friend starts doing long calculations on a 30-60-90 triangle, say: \"You don't need that — the sides are always in a 1 to root-3 to 2 ratio.\"",
    },
    {
      id: "sat2-exponential-growth-formula",
      category: "SAT Math",
      headline: "The Formula Behind Anything That Grows or Shrinks by a Percent Each Year",
      insight: "Situations that grow or shrink by a fixed percentage over repeated time periods, like population growth or a car's value depreciating, follow the formula A = P(1 + r)^t for growth or A = P(1 - r)^t for decay, where P is the starting amount, r is the rate as a decimal, and t is the number of time periods. This is different from steady, straight-line growth because the amount added or lost each period keeps changing as the total changes.",
      takeaway: "Whenever you see 'increases by X% each year' or 'decreases by X% each year' in a word problem, that's a signal to use the exponential growth or decay formula, not a simple straight-line equation.",
      spokenStage: "If a friend tries to solve a 'grows 5% per year' problem with a straight-line equation, say: \"That needs the exponential formula instead — A equals P times 1 plus the rate, raised to the number of years.\"",
    },
    {
      id: "sat2-elimination-before-guessing",
      category: "SAT Strategy",
      headline: "Cross Out the Wrong Answers Even When You're Unsure",
      insight: "On a tough question, it's often easier to spot two or three answer choices that are clearly wrong than it is to know the right answer immediately. Physically eliminating those choices narrows your options and makes the remaining decision much more manageable, even under time pressure.",
      takeaway: "When you're stuck, shift from 'which one is right' to 'which ones are definitely wrong' — you'll usually make faster progress that way.",
      spokenStage: "If a friend freezes on a hard question, say: \"Don't look for the right one yet — just cross out the ones you know are wrong first.\"",
    },
    {
      id: "sat2-module-difficulty-adapts",
      category: "SAT Strategy",
      headline: "The Digital SAT Adjusts Its Difficulty Partway Through Each Section",
      insight: "The Digital SAT is section-adaptive: everyone gets the same first module of a section, but how well you do on it determines whether your second module is a harder or easier set of questions. Scoring well on the first module unlocks a second module that allows for a higher possible score range.",
      takeaway: "Treat every question in the first module of a section as high-value — performing well there directly affects the difficulty (and scoring potential) of the module that follows.",
      spokenStage: "If a friend says they'll 'save their energy' for later questions, say: \"Don't — the first module decides how hard, and how high-scoring, your second module can be.\"",
    },
    {
      id: "sat2-pacing-per-question",
      category: "SAT Strategy",
      headline: "Know Your Rough Time-Per-Question Budget Before You Start",
      insight: "Each Digital SAT module gives you a set amount of time for a set number of questions, so dividing total minutes by total questions gives you a rough per-question budget to aim for. Checking in on your pace partway through a module helps you catch early if you're falling behind before it becomes a real problem.",
      takeaway: "Do the time-per-question math before test day so you have a built-in sense of whether you're moving too slowly, not just a vague feeling of running out of time.",
      spokenStage: "If a friend says they lost track of time during practice, say: \"Work out your minutes-per-question ahead of time, then check in every so often to see if you're on pace.\"",
    },
    {
      id: "sat2-flag-and-skip",
      category: "SAT Strategy",
      headline: "Flag It and Move On Instead of Getting Stuck",
      insight: "The Bluebook testing app lets you mark a question for review and come back to it later, which means getting stuck on one hard question doesn't have to cost you time on easier questions later in the module. Answering the questions you're confident about first protects points you'd otherwise risk losing to the clock.",
      takeaway: "The moment a question feels like it's eating up way more time than it's worth, flag it, make your best guess, and keep moving — you can always return if time allows.",
      spokenStage: "If a friend is stuck rereading the same question for the fourth time, say: \"Flag it and come back later — don't let one question eat time you need for easier ones.\"",
    },
    {
      id: "sat2-verbatim-text-trap",
      category: "SAT Strategy",
      headline: "An Answer That Copies the Passage's Exact Words Can Still Be Wrong",
      insight: "Some wrong answer choices lift phrases word-for-word straight from the passage, which can make them feel 'safe' or obviously correct at a glance. But an answer needs to accurately capture the passage's meaning, not just reuse its vocabulary — a choice can quote the passage directly and still twist or misrepresent what it actually said.",
      takeaway: "Don't trust an answer choice just because you recognize its exact wording from the passage — check whether it actually matches the passage's meaning in context.",
      spokenStage: "If a friend picks an answer because 'it uses the same words as the passage,' say: \"That doesn't mean it's right — check if it actually matches what the passage meant, not just what it said.\"",
    },
    {
      id: "sat2-calculator-graph-check",
      category: "SAT Strategy",
      headline: "Use the Built-In Graphing Calculator to Check, Not Just Calculate",
      insight: "The Digital SAT's built-in Desmos calculator can do more than basic arithmetic — you can type in equations to see their graphs, find intersection points, or test whether a specific point satisfies an equation. For some algebra questions, graphing both sides of an equation and looking for where they cross can be faster and more reliable than solving by hand.",
      takeaway: "Before grinding through algebra on a math question, consider whether typing the equation into the graphing calculator could get you the answer more directly.",
      spokenStage: "If a friend is stuck solving a system of equations by hand, say: \"Just graph both equations on the calculator — wherever they cross is your answer.\"",
    },
    {
      id: "sat2-question-stem-first",
      category: "SAT Strategy",
      headline: "Know What You're Looking For Before You Dig Into a Passage",
      insight: "For reading questions that ask about a specific detail, purpose, or piece of evidence, glancing at the question first gives you a clear target to look for as you read, instead of having to reread the whole passage afterward. This works especially well for shorter Digital SAT passages, where a quick preview of the question doesn't cost much time but can save you a full re-read.",
      takeaway: "A few seconds spent knowing what the question is asking before you read closely can save you a much more expensive re-read later.",
      spokenStage: "If a friend reads a whole passage before checking what's being asked, say: \"Peek at the question first — then you'll know exactly what to look for while you read.\"",
    },
    {
      id: "sat2-highlight-annotate-tool",
      category: "SAT Strategy",
      headline: "Use the Highlight Tool to Track Key Shifts, Not Just Interesting Lines",
      insight: "The Bluebook app's built-in highlighter is most useful when you use it to mark structural signals in a passage — like where the author's argument shifts, contradicts something, or introduces a cause-and-effect relationship — rather than just highlighting anything that sounds important. Marking these turning points makes it much faster to relocate the exact evidence a question is asking about.",
      takeaway: "Highlight the passage's structure (where ideas shift or connect), not just individual facts, so you can navigate back to the right spot quickly when a question asks for evidence.",
      spokenStage: "If a friend highlights almost every sentence, say: \"Try highlighting just the spots where the idea shifts or contradicts something — that's what you'll actually need to find again.\"",
    },
    {
      id: "sat2-no-guessing-penalty",
      category: "SAT Strategy",
      headline: "There's No Penalty for Guessing, So Never Leave a Question Blank",
      insight: "The Digital SAT only counts correct answers toward your score — there's no point deducted for a wrong answer, unlike some older test formats that punished guessing. That means an unanswered question and a wrong guess cost you exactly the same number of points: one missed opportunity.",
      takeaway: "If time is running out, always fill in a guess on remaining questions rather than leaving them blank — you have nothing to lose and a real chance to gain points.",
      spokenStage: "If a friend says they'll leave a hard question blank instead of guessing, say: \"There's no guessing penalty on this test — always put something down, even a guess.\"",
    },
  ];
};

if (typeof window !== "undefined") {
  window.icseEngine = icseEngine;
}
