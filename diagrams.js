// ================================================================
// VISUAL LIBRARY — lesson icons (broad, every lesson) and hand-built
// inline SVG diagrams (curated, highest-value visual concepts only).
// Self-contained: no external images/fonts/network calls, so this
// works identically offline. Exposed as window.icseDiagrams so
// index.html can pull from it without any build step.
// ================================================================

(function () {
  "use strict";

  // ---------- Lesson icons (one emoji per lesson, keyed by lessonKey) ----------
  // Broad coverage layer: every lesson gets a visual anchor even before/without
  // a hand-built diagram below. Lesson keys match content/grade7/<subject>.json.

  const LESSON_ICONS = {
    // Mathematics
    concepts_of_sets: "🔵",
    integers: "➖",
    fractions: "🍰",
    decimals: "🔢",
    rational_numbers: "➗",
    exponents: "📈",
    ratio_proportion: "⚖️",
    unitary_method_variation: "🔁",
    percentage: "💯",
    profit_loss: "💰",
    simple_interest: "🏦",
    speed_time_distance: "🚗",
    fundamental_concepts: "🔤",
    fundamental_operations: "🧮",
    linear_equations_inequations: "🟰",
    geometry_fundamentals: "📐",
    angles: "📐",
    parallel_lines: "🛤️",
    basic_constructions: "🧭",
    triangles: "🔺",
    congruence: "🧩",
    three_dimensional_shapes: "📦",
    symmetry: "🦋",
    perimeter_area: "📏",
    statistics: "📊",
    probability: "🎲",
    multiple_choice_questions: "📝",

    // Physics
    area_measurement: "📐",
    volume_measurement: "🧊",
    density_speed: "⚖️",
    rest_motion: "🏃",
    speed_velocity: "🚀",
    energy_work: "⚡",
    various_forms_energy: "🔋",
    light_terms: "💡",
    reflection_plane: "🪞",
    heat_effects: "🔥",
    temperature_measurement: "🌡️",
    thermal_expansion: "📏",
    transmission_heat: "♨️",
    sound_production: "🔊",
    reflection_sound: "🗣️",
    magnetism_laws: "🧲",
    electric_circuit: "🔌",

    // Chemistry
    matter: "🧪",
    changes: "🔄",
    mixtures: "🧫",
    atomic_structure: "⚛️",
    language_chem: "🔤",
    metals: "🔩",
    air: "🌬️",

    // Biology
    tissues: "🧬",
    classification_plants: "🌿",
    classification_animals: "🐾",
    photosynthesis_respiration: "🍃",
    excretion: "🫘",
    nervous_system: "🧠",
    allergy: "🤧",
  };

  // ---------- Diagram <-> lesson mapping ----------
  // Only lessons where a real diagram adds genuine understanding get one.
  const LESSON_DIAGRAM = {
    geometry_fundamentals: "triangle_angle_sum",
    triangles: "pythagoras",
    parallel_lines: "parallel_transversal",
    concepts_of_sets: "venn_diagram",
    three_dimensional_shapes: "cube_net",
    symmetry: "symmetry_shapes",

    reflection_plane: "plane_mirror",
    electric_circuit: "circuits",
    magnetism_laws: "magnet_field",
    reflection_sound: "sound_wave",

    atomic_structure: "atomic_structure",
    matter: "states_of_matter",
    language_chem: "water_molecule",
    air: "air_composition",

    nervous_system: "neuron",
    tissues: "xylem_phloem",
    classification_animals: "animal_tree",
    classification_plants: "plant_tree",
    excretion: "nephron",
  };

  // ---------- Shared style tokens ----------
  const INK = "#e2e8f0"; // slate-200 label text
  const MUTED = "#94a3b8"; // slate-400 secondary text
  const CYAN = "#38bdf8";
  const EMERALD = "#34d399";
  const AMBER = "#f59e0b";
  const PINK = "#f472b6";
  const HEAD = 'font-family="Segoe UI, system-ui, sans-serif"';

  function svg(inner) {
    return (
      '<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto" role="img">' +
      inner +
      "</svg>"
    );
  }

  const DIAGRAMS = {};

  // ---- Mathematics ----

  DIAGRAMS.triangle_angle_sum = svg(
    '<polygon points="30,170 210,170 120,30" fill="none" stroke="' + CYAN + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<text x="18" y="188" fill="' + AMBER + '" font-size="15" font-weight="700" ' + HEAD + '>A</text>' +
    '<text x="205" y="188" fill="' + AMBER + '" font-size="15" font-weight="700" ' + HEAD + '>B</text>' +
    '<text x="115" y="22" fill="' + AMBER + '" font-size="15" font-weight="700" ' + HEAD + '>C</text>' +
    '<text x="48" y="158" fill="' + INK + '" font-size="14" ' + HEAD + '>a</text>' +
    '<text x="178" y="158" fill="' + INK + '" font-size="14" ' + HEAD + '>b</text>' +
    '<text x="118" y="48" fill="' + INK + '" font-size="14" ' + HEAD + '>c</text>' +
    '<text x="120" y="196" fill="' + MUTED + '" font-size="13" text-anchor="middle" ' + HEAD + '>a + b + c = 180°</text>'
  );

  DIAGRAMS.pythagoras = svg(
    '<polygon points="40,170 40,50 190,170" fill="none" stroke="' + CYAN + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<rect x="40" y="155" width="15" height="15" fill="none" stroke="' + MUTED + '" stroke-width="2"/>' +
    '<text x="16" y="112" fill="' + INK + '" font-size="14" ' + HEAD + '>a</text>' +
    '<text x="112" y="188" fill="' + INK + '" font-size="14" ' + HEAD + '>b</text>' +
    '<text x="98" y="100" fill="' + INK + '" font-size="14" ' + HEAD + '>c</text>' +
    '<text x="120" y="12" fill="' + MUTED + '" font-size="13" text-anchor="middle" ' + HEAD + '>a² + b² = c²</text>'
  );

  DIAGRAMS.parallel_transversal = svg(
    '<line x1="20" y1="60" x2="220" y2="60" stroke="' + CYAN + '" stroke-width="3"/>' +
    '<line x1="20" y1="140" x2="220" y2="140" stroke="' + CYAN + '" stroke-width="3"/>' +
    '<path d="M198,54 l8,6 l-8,6" fill="none" stroke="' + CYAN + '" stroke-width="2"/>' +
    '<path d="M198,134 l8,6 l-8,6" fill="none" stroke="' + CYAN + '" stroke-width="2"/>' +
    '<line x1="65" y1="20" x2="175" y2="180" stroke="' + AMBER + '" stroke-width="3"/>' +
    '<text x="10" y="55" fill="' + MUTED + '" font-size="12" ' + HEAD + '>ℓ₁</text>' +
    '<text x="10" y="135" fill="' + MUTED + '" font-size="12" ' + HEAD + '>ℓ₂</text>' +
    '<text x="120" y="196" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Corresponding angles are equal</text>'
  );

  DIAGRAMS.venn_diagram = svg(
    '<rect x="15" y="20" width="210" height="150" fill="none" stroke="' + MUTED + '" stroke-width="2" rx="6"/>' +
    '<circle cx="95" cy="100" r="55" fill="' + CYAN + '" fill-opacity="0.18" stroke="' + CYAN + '" stroke-width="2.5"/>' +
    '<circle cx="150" cy="100" r="55" fill="' + EMERALD + '" fill-opacity="0.18" stroke="' + EMERALD + '" stroke-width="2.5"/>' +
    '<text x="24" y="34" fill="' + MUTED + '" font-size="13" ' + HEAD + '>U</text>' +
    '<text x="62" y="70" fill="' + INK + '" font-size="15" font-weight="700" ' + HEAD + '>A</text>' +
    '<text x="182" y="70" fill="' + INK + '" font-size="15" font-weight="700" ' + HEAD + '>B</text>' +
    '<text x="122" y="103" fill="' + INK + '" font-size="11" text-anchor="middle" ' + HEAD + '>A∩B</text>'
  );

  DIAGRAMS.cube_net = svg(
    '<g fill="none" stroke="' + CYAN + '" stroke-width="2.5">' +
    '<rect x="80" y="30" width="42" height="42"/>' +
    '<rect x="38" y="72" width="42" height="42"/>' +
    '<rect x="80" y="72" width="42" height="42"/>' +
    '<rect x="122" y="72" width="42" height="42"/>' +
    '<rect x="164" y="72" width="42" height="42"/>' +
    '<rect x="80" y="114" width="42" height="42"/>' +
    "</g>" +
    '<text x="120" y="186" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Folds into a closed cube</text>'
  );

  DIAGRAMS.symmetry_shapes = svg(
    '<polygon points="35,170 35,90 60,55 85,90 85,170" fill="none" stroke="' + CYAN + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<line x1="60" y1="40" x2="60" y2="180" stroke="' + AMBER + '" stroke-width="2" stroke-dasharray="5 5"/>' +
    '<text x="60" y="34" fill="' + MUTED + '" font-size="11" text-anchor="middle" ' + HEAD + '>line of symmetry</text>' +
    '<rect x="150" y="70" width="50" height="50" fill="none" stroke="' + EMERALD + '" stroke-width="2.5"/>' +
    '<path d="M212,95 a37,37 0 1 1 -8,-24" fill="none" stroke="' + EMERALD + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
    '<text x="175" y="150" fill="' + MUTED + '" font-size="11" text-anchor="middle" ' + HEAD + '>rotational, order 4</text>'
  );

  // ---- Physics ----

  DIAGRAMS.plane_mirror = svg(
    '<line x1="120" y1="20" x2="120" y2="180" stroke="' + INK + '" stroke-width="4"/>' +
    '<g stroke="' + MUTED + '" stroke-width="1.5">' +
    '<line x1="120" y1="30" x2="130" y2="20"/><line x1="120" y1="55" x2="130" y2="45"/>' +
    '<line x1="120" y1="80" x2="130" y2="70"/><line x1="120" y1="105" x2="130" y2="95"/>' +
    '<line x1="120" y1="130" x2="130" y2="120"/><line x1="120" y1="155" x2="130" y2="145"/>' +
    "</g>" +
    '<line x1="60" y1="60" x2="180" y2="60" stroke="' + MUTED + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
    '<line x1="60" y1="20" x2="120" y2="60" stroke="' + AMBER + '" stroke-width="2.5"/>' +
    '<line x1="120" y1="60" x2="60" y2="100" stroke="' + EMERALD + '" stroke-width="2.5"/>' +
    '<text x="65" y="16" fill="' + AMBER + '" font-size="12" ' + HEAD + '>incident</text>' +
    '<text x="30" y="112" fill="' + EMERALD + '" font-size="12" ' + HEAD + '>reflected</text>' +
    '<text x="80" y="54" fill="' + INK + '" font-size="12" ' + HEAD + '>i</text>' +
    '<text x="80" y="72" fill="' + INK + '" font-size="12" ' + HEAD + '>r</text>' +
    '<text x="120" y="196" fill="' + MUTED + '" font-size="13" text-anchor="middle" ' + HEAD + '>∠i = ∠r</text>'
  );

  DIAGRAMS.circuits = svg(
    '<g fill="none" stroke="' + CYAN + '" stroke-width="2.5">' +
    '<rect x="15" y="30" width="90" height="110"/>' +
    "</g>" +
    '<line x1="5" y1="78" x2="25" y2="78" stroke="' + AMBER + '" stroke-width="2"/>' +
    '<line x1="8" y1="92" x2="22" y2="92" stroke="' + AMBER + '" stroke-width="6"/>' +
    '<circle cx="45" cy="30" r="9" fill="none" stroke="' + EMERALD + '" stroke-width="2"/>' +
    '<circle cx="75" cy="30" r="9" fill="none" stroke="' + EMERALD + '" stroke-width="2"/>' +
    '<text x="60" y="155" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Series</text>' +
    '<g fill="none" stroke="' + CYAN + '" stroke-width="2.5">' +
    '<rect x="135" y="30" width="90" height="110"/>' +
    '<line x1="180" y1="30" x2="180" y2="140"/>' +
    "</g>" +
    '<line x1="125" y1="78" x2="145" y2="78" stroke="' + AMBER + '" stroke-width="2"/>' +
    '<line x1="128" y1="92" x2="142" y2="92" stroke="' + AMBER + '" stroke-width="6"/>' +
    '<circle cx="157" cy="30" r="9" fill="none" stroke="' + EMERALD + '" stroke-width="2"/>' +
    '<circle cx="203" cy="30" r="9" fill="none" stroke="' + EMERALD + '" stroke-width="2"/>' +
    '<text x="180" y="155" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Parallel</text>'
  );

  DIAGRAMS.magnet_field = svg(
    '<rect x="70" y="85" width="45" height="30" fill="' + AMBER + '" fill-opacity="0.35" stroke="' + AMBER + '" stroke-width="2"/>' +
    '<rect x="115" y="85" width="45" height="30" fill="' + CYAN + '" fill-opacity="0.35" stroke="' + CYAN + '" stroke-width="2"/>' +
    '<text x="92" y="105" fill="' + INK + '" font-size="14" font-weight="700" text-anchor="middle" ' + HEAD + '>N</text>' +
    '<text x="138" y="105" fill="' + INK + '" font-size="14" font-weight="700" text-anchor="middle" ' + HEAD + '>S</text>' +
    '<path d="M70,95 C30,70 30,40 92,30" fill="none" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<path d="M92,30 C154,40 154,70 160,95" fill="none" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<path d="M70,105 C30,130 30,160 92,170" fill="none" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<path d="M92,170 C154,160 154,130 160,105" fill="none" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<polygon points="146,52 138,58 148,62" fill="' + MUTED + '"/>' +
    '<polygon points="146,148 138,142 148,138" fill="' + MUTED + '"/>' +
    '<text x="120" y="196" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Field lines: N around to S</text>'
  );

  DIAGRAMS.sound_wave = svg(
    '<path d="M20,100 C40,40 60,40 80,100 S120,160 140,100 S180,40 200,100" fill="none" stroke="' + CYAN + '" stroke-width="3"/>' +
    '<line x1="50" y1="100" x2="50" y2="55" stroke="' + AMBER + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
    '<text x="56" y="75" fill="' + AMBER + '" font-size="11" ' + HEAD + '>Amplitude</text>' +
    '<line x1="20" y1="185" x2="140" y2="185" stroke="' + EMERALD + '" stroke-width="1.5"/>' +
    '<text x="80" y="180" fill="' + EMERALD + '" font-size="11" text-anchor="middle" ' + HEAD + '>Wavelength (λ)</text>'
  );

  // ---- Chemistry ----

  DIAGRAMS.atomic_structure = svg(
    '<circle cx="120" cy="100" r="70" fill="none" stroke="' + MUTED + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
    '<circle cx="120" cy="100" r="40" fill="none" stroke="' + MUTED + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
    '<circle cx="120" cy="100" r="12" fill="' + AMBER + '"/>' +
    '<text x="120" y="128" fill="' + AMBER + '" font-size="11" text-anchor="middle" ' + HEAD + '>nucleus</text>' +
    '<circle cx="120" cy="60" r="5" fill="' + CYAN + '"/><circle cx="120" cy="140" r="5" fill="' + CYAN + '"/>' +
    '<circle cx="50" cy="100" r="5" fill="' + CYAN + '"/><circle cx="190" cy="100" r="5" fill="' + CYAN + '"/>' +
    '<circle cx="70" cy="45" r="5" fill="' + CYAN + '"/><circle cx="170" cy="155" r="5" fill="' + CYAN + '"/>' +
    '<text x="200" y="95" fill="' + CYAN + '" font-size="12" ' + HEAD + '>e⁻</text>' +
    '<text x="120" y="14" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>Shells around a central nucleus</text>'
  );

  DIAGRAMS.states_of_matter = svg(
    "" +
      makeStateBox(15, "Solid", "grid") +
      makeStateBox(90, "Liquid", "loose") +
      makeStateBox(165, "Gas", "sparse")
  );

  function makeStateBox(x, label, kind) {
    var out = '<rect x="' + x + '" y="30" width="60" height="110" fill="none" stroke="' + MUTED + '" stroke-width="2"/>';
    var pts = [];
    if (kind === "grid") {
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) pts.push([x + 15 + c * 15, 45 + r * 25]);
    } else if (kind === "loose") {
      pts = [[x+15,50],[x+35,58],[x+20,75],[x+45,80],[x+30,100],[x+50,105],[x+18,120],[x+40,130]];
    } else {
      pts = [[x+20,45],[x+50,60],[x+15,90],[x+45,110],[x+30,135],[x+55,42]];
    }
    pts.forEach(function (p) {
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + CYAN + '"/>';
    });
    out += '<text x="' + (x + 30) + '" y="158" fill="' + INK + '" font-size="12" text-anchor="middle" ' + HEAD + '>' + label + "</text>";
    return out;
  }

  DIAGRAMS.water_molecule = svg(
    '<line x1="120" y1="90" x2="75" y2="145" stroke="' + MUTED + '" stroke-width="3"/>' +
    '<line x1="120" y1="90" x2="165" y2="145" stroke="' + MUTED + '" stroke-width="3"/>' +
    '<circle cx="120" cy="90" r="26" fill="' + CYAN + '" fill-opacity="0.35" stroke="' + CYAN + '" stroke-width="2.5"/>' +
    '<circle cx="75" cy="145" r="15" fill="' + AMBER + '" fill-opacity="0.35" stroke="' + AMBER + '" stroke-width="2"/>' +
    '<circle cx="165" cy="145" r="15" fill="' + AMBER + '" fill-opacity="0.35" stroke="' + AMBER + '" stroke-width="2"/>' +
    '<text x="120" y="95" fill="' + INK + '" font-size="14" font-weight="700" text-anchor="middle" ' + HEAD + '>O</text>' +
    '<text x="75" y="150" fill="' + INK + '" font-size="13" font-weight="700" text-anchor="middle" ' + HEAD + '>H</text>' +
    '<text x="165" y="150" fill="' + INK + '" font-size="13" font-weight="700" text-anchor="middle" ' + HEAD + '>H</text>' +
    '<text x="120" y="30" fill="' + MUTED + '" font-size="12" text-anchor="middle" ' + HEAD + '>H₂O — two hydrogens, one oxygen</text>'
  );

  DIAGRAMS.air_composition = svg(
    '<rect x="20" y="80" width="200" height="40" fill="none" stroke="' + MUTED + '" stroke-width="2" rx="4"/>' +
    '<rect x="20" y="80" width="156" height="40" fill="' + CYAN + '" fill-opacity="0.55"/>' +
    '<rect x="176" y="80" width="42" height="40" fill="' + EMERALD + '" fill-opacity="0.6"/>' +
    '<rect x="218" y="80" width="2" height="40" fill="' + AMBER + '"/>' +
    '<text x="98" y="104" fill="' + INK + '" font-size="13" text-anchor="middle" ' + HEAD + '>N₂ ~78%</text>' +
    '<text x="197" y="104" fill="' + INK + '" font-size="11" text-anchor="middle" ' + HEAD + '>O₂ ~21%</text>' +
    '<text x="120" y="150" fill="' + MUTED + '" font-size="11" text-anchor="middle" ' + HEAD + '>+ CO₂, water vapour, noble gases (~1%)</text>'
  );

  // ---- Biology ----

  DIAGRAMS.neuron = svg(
    '<g stroke="' + CYAN + '" stroke-width="2" fill="none">' +
    '<line x1="35" y1="60" x2="60" y2="90"/><line x1="30" y1="80" x2="60" y2="95"/><line x1="35" y1="105" x2="60" y2="100"/>' +
    "</g>" +
    '<circle cx="70" cy="95" r="18" fill="' + CYAN + '" fill-opacity="0.3" stroke="' + CYAN + '" stroke-width="2.5"/>' +
    '<line x1="88" y1="95" x2="180" y2="95" stroke="' + EMERALD + '" stroke-width="3"/>' +
    '<g stroke="' + EMERALD + '" stroke-width="2" fill="none">' +
    '<line x1="180" y1="95" x2="205" y2="80"/><line x1="180" y1="95" x2="205" y2="95"/><line x1="180" y1="95" x2="205" y2="110"/>' +
    "</g>" +
    '<text x="30" y="45" fill="' + MUTED + '" font-size="11" ' + HEAD + '>dendrites</text>' +
    '<text x="55" y="125" fill="' + MUTED + '" font-size="11" ' + HEAD + '>cell body</text>' +
    '<text x="115" y="85" fill="' + MUTED + '" font-size="11" ' + HEAD + '>axon</text>' +
    '<text x="185" y="128" fill="' + AMBER + '" font-size="11" ' + HEAD + '>synapse</text>'
  );

  DIAGRAMS.xylem_phloem = svg(
    '<path d="M120,20 L100,45 L140,45 Z" fill="' + EMERALD + '" fill-opacity="0.4" stroke="' + EMERALD + '" stroke-width="2"/>' +
    '<rect x="95" y="45" width="50" height="110" fill="none" stroke="' + MUTED + '" stroke-width="2"/>' +
    '<line x1="112" y1="50" x2="112" y2="150" stroke="' + CYAN + '" stroke-width="4"/>' +
    '<line x1="128" y1="50" x2="128" y2="150" stroke="' + AMBER + '" stroke-width="4"/>' +
    '<path d="M112,60 l-5,10 h10 z" fill="' + CYAN + '"/>' +
    '<path d="M128,140 l-5,-10 h10 z" fill="' + AMBER + '"/>' +
    '<line x1="95" y1="155" x2="75" y2="180" stroke="' + MUTED + '" stroke-width="2"/>' +
    '<line x1="120" y1="155" x2="120" y2="180" stroke="' + MUTED + '" stroke-width="2"/>' +
    '<line x1="145" y1="155" x2="165" y2="180" stroke="' + MUTED + '" stroke-width="2"/>' +
    '<text x="60" y="105" fill="' + CYAN + '" font-size="11" text-anchor="end" ' + HEAD + '>Xylem (water ↑)</text>' +
    '<text x="180" y="105" fill="' + AMBER + '" font-size="11" ' + HEAD + '>Phloem (food)</text>'
  );

  DIAGRAMS.animal_tree = svg(
    '<text x="120" y="18" fill="' + INK + '" font-size="13" font-weight="700" text-anchor="middle" ' + HEAD + '>Animalia</text>' +
    '<line x1="120" y1="24" x2="55" y2="48" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<line x1="120" y1="24" x2="185" y2="48" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<text x="55" y="60" fill="' + CYAN + '" font-size="11" text-anchor="middle" ' + HEAD + '>Invertebrates</text>' +
    '<text x="185" y="60" fill="' + EMERALD + '" font-size="11" text-anchor="middle" ' + HEAD + '>Vertebrates</text>' +
    '<line x1="55" y1="64" x2="22" y2="86" stroke="' + MUTED + '" stroke-width="1"/>' +
    '<line x1="55" y1="64" x2="90" y2="86" stroke="' + MUTED + '" stroke-width="1"/>' +
    '<text x="22" y="98" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Arthropoda</text>' +
    '<text x="90" y="98" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Mollusca…</text>' +
    '<g stroke="' + MUTED + '" stroke-width="1">' +
    '<line x1="185" y1="64" x2="140" y2="150"/><line x1="185" y1="64" x2="165" y2="150"/>' +
    '<line x1="185" y1="64" x2="188" y2="150"/><line x1="185" y1="64" x2="211" y2="150"/>' +
    '<line x1="185" y1="64" x2="232" y2="150"/>' +
    "</g>" +
    '<text x="140" y="162" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Fish</text>' +
    '<text x="165" y="174" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Amph.</text>' +
    '<text x="188" y="162" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Reptile</text>' +
    '<text x="211" y="174" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Bird</text>' +
    '<text x="232" y="162" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Mammal</text>'
  );

  DIAGRAMS.plant_tree = svg(
    '<text x="120" y="20" fill="' + INK + '" font-size="13" font-weight="700" text-anchor="middle" ' + HEAD + '>Plantae</text>' +
    '<line x1="30" y1="35" x2="210" y2="35" stroke="' + MUTED + '" stroke-width="1.5"/>' +
    '<g stroke="' + MUTED + '" stroke-width="1"><line x1="30" y1="35" x2="30" y2="55"/><line x1="90" y1="35" x2="90" y2="55"/><line x1="150" y1="35" x2="150" y2="55"/><line x1="210" y1="35" x2="210" y2="55"/></g>' +
    '<text x="30" y="70" fill="' + MUTED + '" font-size="10" text-anchor="middle" ' + HEAD + '>Thallophyta</text>' +
    '<text x="90" y="70" fill="' + MUTED + '" font-size="10" text-anchor="middle" ' + HEAD + '>Bryophyta</text>' +
    '<text x="150" y="70" fill="' + MUTED + '" font-size="10" text-anchor="middle" ' + HEAD + '>Pteridophyta</text>' +
    '<text x="210" y="70" fill="' + EMERALD + '" font-size="10" text-anchor="middle" ' + HEAD + '>Spermatophyta</text>' +
    '<line x1="210" y1="75" x2="185" y2="100" stroke="' + MUTED + '" stroke-width="1"/>' +
    '<line x1="210" y1="75" x2="230" y2="100" stroke="' + MUTED + '" stroke-width="1"/>' +
    '<text x="180" y="112" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Gymnosperms</text>' +
    '<text x="230" y="124" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>Angiosperms</text>' +
    '<line x1="30" y1="130" x2="210" y2="130" stroke="' + AMBER + '" stroke-width="1.5"/>' +
    '<path d="M205,130 l8,-4 l0,8 z" fill="' + AMBER + '"/>' +
    '<text x="120" y="150" fill="' + AMBER + '" font-size="11" text-anchor="middle" ' + HEAD + '>Increasing complexity →</text>'
  );

  DIAGRAMS.nephron = svg(
    '<path d="M60,40 C20,55 20,145 60,160 C90,170 90,30 60,40 Z" fill="' + EMERALD + '" fill-opacity="0.15" stroke="' + EMERALD + '" stroke-width="2.5"/>' +
    '<text x="55" y="100" fill="' + EMERALD + '" font-size="11" text-anchor="middle" ' + HEAD + '>Kidney</text>' +
    '<line x1="90" y1="150" x2="110" y2="180" stroke="' + MUTED + '" stroke-width="2.5"/>' +
    '<text x="118" y="185" fill="' + MUTED + '" font-size="10" ' + HEAD + '>ureter</text>' +
    '<circle cx="170" cy="55" r="16" fill="none" stroke="' + CYAN + '" stroke-width="2"/>' +
    '<path d="M182,60 C210,70 210,110 190,120 C175,128 165,110 175,100 C185,92 175,80 195,80" fill="none" stroke="' + CYAN + '" stroke-width="2"/>' +
    '<text x="170" y="35" fill="' + CYAN + '" font-size="10" text-anchor="middle" ' + HEAD + '>Nephron</text>' +
    '<text x="185" y="140" fill="' + MUTED + '" font-size="9" text-anchor="middle" ' + HEAD + '>(filtering unit)</text>'
  );

  window.icseDiagrams = {
    icons: LESSON_ICONS,
    lessonDiagram: LESSON_DIAGRAM,
    svgs: DIAGRAMS,
    getIcon: function (lessonKey) {
      return LESSON_ICONS[lessonKey] || "📘";
    },
    getDiagram: function (lessonKey) {
      var id = LESSON_DIAGRAM[lessonKey];
      return id ? DIAGRAMS[id] : null;
    },
  };
})();
