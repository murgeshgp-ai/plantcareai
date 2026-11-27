import { PlantCategory } from './plantDatabase';
import {
  ClimateZoneInfo,
  IndianSeasonId,
  IndianSeasonMeta,
  KarnatakaClimateZoneId,
  PlantSeasonalOverride,
  SeasonalCareGuidanceFields,
} from '../types/seasonal';

export const KARNATAKA_CLIMATE_ZONES: Record<KarnatakaClimateZoneId, ClimateZoneInfo> = {
  'general-karnataka': {
    id: 'general-karnataka',
    label: 'General India / Karnataka (Default)',
    shortLabel: 'General India / Karnataka',
    regions: 'Broad Indian & Karnataka seasonal conditions',
    description:
      'Balanced seasonal guidance without assuming live local weather. Choose a Karnataka sub-region if you want closer regional tailoring.',
  },
  'bengaluru-south-interior': {
    id: 'bengaluru-south-interior',
    label: 'Bengaluru & South Interior Karnataka',
    shortLabel: 'Bengaluru & South Interior',
    regions: 'Bengaluru, Mysuru, Tumakuru, Mandya, Hassan, Kolar',
    description:
      'Moderate plateau temperatures, dry afternoon heat in Apr–May, pleasant post-monsoon breezes, and cool crisp winter mornings.',
  },
  'coastal-malnad': {
    id: 'coastal-malnad',
    label: 'Coastal & Malnad Karnataka',
    shortLabel: 'Coastal & Malnad',
    regions: 'Mangaluru, Udupi, Karwar, Kodagu, Chikkamagaluru, Shivamogga',
    description:
      'High ambient humidity year-round with heavy southwest monsoon rainfall; strong focus on fast drainage and fungal prevention.',
  },
  'north-interior': {
    id: 'north-interior',
    label: 'North Interior Karnataka',
    shortLabel: 'North Interior Karnataka',
    regions: 'Hubballi-Dharwad, Belagavi, Kalaburagi, Ballari, Vijayapura',
    description:
      'Intense summer heat and lower dry-season humidity; prioritizes afternoon shade nets, deep mulching, and evening misting.',
  },
};

export const INDIAN_SEASON_ORDER: IndianSeasonId[] = [
  'summer',
  'monsoon',
  'post-monsoon',
  'winter',
];

export const INDIAN_SEASONS: Record<IndianSeasonId, IndianSeasonMeta> = {
  summer: {
    id: 'summer',
    name: 'Summer',
    kannadaName: 'ಬೇಸಿಗೆ (Besige)',
    monthsLabel: 'March – May',
    months: [3, 4, 5],
    tagline: 'Warm, bright days with faster soil evaporation',
    overview:
      'Rising temperatures and intense midday sun accelerate moisture loss across terrace, balcony, and window pots. Focus on early-morning watering, mulching, and afternoon heat protection.',
    generalTips: [
      'Water early in the morning (6–8 AM) or after sunset to minimize evaporation and leaf scorch.',
      'Add a 1–2 inch mulch layer of dry leaves, cocopeat, or straw on terrace pots to keep roots cool.',
      'Shift sensitive foliage plants back from harsh west-facing glass or use 50% green shade net.',
      'Inspect undersides of leaves weekly for spider mites, mealybugs, and aphids that multiply in dry heat.',
    ],
    recommendedActivities: [
      'Mulch outdoor, fruit, and vegetable containers to lock in soil moisture',
      'Group humidity-loving indoor plants together or set up pebble water trays',
      'Switch to diluted liquid organic feeds (seaweed/compost tea) instead of strong chemical fertilizers',
      'Check terracotta pots twice as often—they breathe well but dry out faster in summer',
    ],
    regionalNotes: {
      'general-karnataka':
        'General seasonal guidance: temperatures vary widely between coastal, plateau, and northern districts—always check top 1 inch of soil with your finger before watering.',
      'bengaluru-south-interior':
        'Bengaluru & South Interior: mornings remain mild, but April–May afternoon sun on south/west balconies can scorch tender leaves and dry grow bags within a day.',
      'coastal-malnad':
        'Coastal & Malnad: heat is paired with high humidity, so moisture stays slightly longer than inland; ensure good airflow to avoid heat-humidity fungal spots.',
      'north-interior':
        'North Interior: intense dry afternoon heat (38–42°C) stresses terrace and courtyard plants quickly—50% shade cloth and thick organic mulch are highly recommended.',
    },
  },
  monsoon: {
    id: 'monsoon',
    name: 'Monsoon',
    kannadaName: 'ಮಳೆಗಾಲ (Malegala)',
    monthsLabel: 'June – September',
    months: [6, 7, 8, 9],
    tagline: 'High humidity, cloudy skies, and heavy rain spells',
    overview:
      'Monsoon invigorates tropical growth, but prolonged wet soil and low sunlight can trigger root rot and fungal leaf spots. Prioritize drainage, airflow, and rain shelter for delicate pots.',
    generalTips: [
      'Check pot drainage holes and empty saucer trays immediately after rain so roots never sit in standing water.',
      'Always test soil 1–2 inches deep before watering; overcast skies dramatically slow drying.',
      'Elevate pots on bricks or plant stands to improve airflow and keep snails/slugs away.',
      'Apply preventive diluted cold-pressed neem oil spray every 10–14 days on dry mornings.',
    ],
    recommendedActivities: [
      'Clear blocked drainage holes and top-dress compacted soil with coarse sand or perlite',
      'Take stem cuttings of hibiscus, money plant, jasmine, and coleus—high humidity speeds rooting',
      'Trim yellow, rotting, or densely crowded lower leaves to prevent fungal spread',
      'Move succulents, snake plants, and potted Tulsi under partial eaves during continuous downpours',
    ],
    regionalNotes: {
      'general-karnataka':
        'General seasonal guidance: rainfall intensity differs sharply across India and Karnataka—adjust rain shelter based on whether your area gets light showers or continuous downpours.',
      'bengaluru-south-interior':
        'Bengaluru & South Interior: intermittent showers and cool cloudy days mean indoor pots dry much slower; avoid watering on schedule if soil still feels damp.',
      'coastal-malnad':
        'Coastal & Malnad: sustained heavy rains can wash away soil nutrients and saturate roots quickly—keep potted herbs and succulents sheltered and inspect daily for root rot and slugs.',
      'north-interior':
        'North Interior: rainfall can be uneven with humid warm gaps; take advantage of rains to flush salt buildup from pots, while keeping watch on sudden dry spells.',
    },
  },
  'post-monsoon': {
    id: 'post-monsoon',
    name: 'Post-Monsoon',
    kannadaName: 'ಹಿಂಗಾರು (Hingaru)',
    monthsLabel: 'October – November',
    months: [10, 11],
    tagline: 'Returning sunshine, mild temperatures, and peak renewal',
    overview:
      'Clearer skies combined with residual moisture create one of the best gardening windows of the year. Ideal time for repotting, light pruning, feeding depleted soil, and starting winter veggies.',
    generalTips: [
      'Replenish soil nutrients leached during monsoon by top-dressing with vermicompost or well-rotted cow manure.',
      'Resume regular pruning to shape overgrown monsoon stems and stimulate fresh flowering buds.',
      'Watch for transitional pests like aphids, whiteflies, and caterpillars as fresh tender shoots emerge.',
      'Gradually re-acclimate shaded plants to brighter morning sun as cloud cover clears.',
    ],
    recommendedActivities: [
      'Top-dress containers with vermicompost + a pinch of neem cake powder for root protection',
      'Repot root-bound plants before cooler winter dormancy arrives',
      'Sow cool-season herbs and vegetables like coriander, palak, tomato, and marigold',
      'Clean dust and monsoon algae off foliage and terracotta pot exteriors',
    ],
    regionalNotes: {
      'general-karnataka':
        'General seasonal guidance: October often brings occasional northeast retreating showers alongside warm sunny afternoons—keep drainage clear while gradually increasing watering on dry days.',
      'bengaluru-south-interior':
        'Bengaluru & South Interior: northeast monsoon showers can still arrive in Oct–Nov; enjoy prime flowering weather for jasmine, rose, chrysanthemum, and marigold.',
      'coastal-malnad':
        'Coastal & Malnad: humidity stays elevated as rains taper off—brighter sun returns rapidly, making this the ideal window to refresh leached potting mixes with organic compost.',
      'north-interior':
        'North Interior: skies clear quickly and daytime warmth returns before winter evenings cool down; replenish organic matter and keep soil evenly moist for fruiting and flowering plants.',
    },
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    kannadaName: 'ಚಳಿಗಾಲ (Chaligala)',
    monthsLabel: 'December – February',
    months: [12, 1, 2],
    tagline: 'Cool mornings, gentle sun, and slower plant metabolism',
    overview:
      'Lower night temperatures and shorter days slow growth for many tropical plants while helping winter bloomers and leafy greens flourish. Reduce watering frequency and maximize morning sunlight.',
    generalTips: [
      'Water mid-morning (8–10 AM) with room-temperature water rather than late evening to prevent cold root shock.',
      'Reduce fertilizing for slow-growing indoor tropicals; save heavy feeding for winter bloomers like roses and chrysanthemums.',
      'Move sun-loving plants like Tulsi, curry leaf, and hibiscus to spots receiving full gentle morning sun.',
      'Watch for morning dew triggering powdery mildew on roses, tulsi, and squash/vegetable leaves.',
    ],
    recommendedActivities: [
      'Reduce watering intervals slightly for indoor foliage and succulents as evaporation drops',
      'Rotate indoor pots weekly so plants lean evenly toward softer winter window light',
      'Harvest cool-season leafy greens (coriander, palak, mint) and deadhead winter flowers regularly',
      'Shield cold-sensitive tropicals (betel leaf, calathea, curry leaf) from chilly night drafts',
    ],
    regionalNotes: {
      'general-karnataka':
        'General seasonal guidance: South Indian winters are milder than North India, though cool nights (12–16°C) still slow tropical growth—avoid overwatering cold soil.',
      'bengaluru-south-interior':
        'Bengaluru & South Interior: crisp mornings and dewy nights slow evaporation noticeably; water indoor plants only when the top 2 inches dry out and keep Tulsi in warm morning sun.',
      'coastal-malnad':
        'Coastal & Malnad: coastal winters stay warm and mild with sunny dry days, while Malnad hills experience cool misty mornings—adjust watering based on local morning mist and temperature.',
      'north-interior':
        'North Interior: cool dry nights contrast with bright sunny afternoons; morning watering and light mulch help roots stay comfortable through wide day-night temperature swings.',
    },
  },
};

/**
 * Baseline seasonal guidance tailored by PlantCategory across all 4 Indian seasons.
 */
export const CATEGORY_SEASONAL_PROFILES: Record<
  PlantCategory,
  Record<IndianSeasonId, SeasonalCareGuidanceFields>
> = {
  Indoor: {
    summer: {
      watering: 'Check top 1–2 inches of soil every 2–3 days; indoor fans and AC dry pots faster than usual.',
      sunlight: 'Pull back 2–3 feet from harsh south or west windows; provide bright filtered indirect light.',
      soilMoisture: 'Keep evenly lightly moist (or allow full dry-out for succulents/snake plants) without soggy bottoms.',
      fertilizer: 'Feed monthly with half-strength balanced liquid fertilizer or seaweed extract during active growth.',
      pruning: 'Trim brown crisp leaf tips with clean scissors and wipe dust off leaves to aid breathing.',
      pestAndDisease: 'Watch leaf undersides for spider mites and mealybugs thriving in dry warm indoor air.',
      heatAndRainProtection: 'Keep away from direct AC blasts and hot afternoon window glass; mist humidity-loving foliage in the morning.',
    },
    monsoon: {
      watering: 'Stretch watering intervals by 30–50%; never water until the top 2 inches feel genuinely dry.',
      sunlight: 'Move closer to bright east/north windows to compensate for overcast monsoon skies.',
      soilMoisture: 'Prioritize airy, fast-draining soil; empty drip trays immediately to prevent root rot.',
      fertilizer: 'Reduce fertilizing to once every 4–6 weeks; avoid excess nitrogen during low-light damp spells.',
      pruning: 'Snip yellowing or soft stems promptly and propagate healthy cuttings in high monsoon humidity.',
      pestAndDisease: 'Guard against fungus gnats, mold on soil surface, and bacterial leaf spots; sprinkle cinnamon or neem cake on topsoil.',
      heatAndRainProtection: 'Keep away from driving rain near open windows and ensure gentle room air circulation.',
    },
    'post-monsoon': {
      watering: 'Return to a steady moderate watering routine as humidity drops and daylight brightens.',
      sunlight: 'Bright indirect light near windows supports strong autumn-winter leaf production.',
      soilMoisture: 'Loosen compacted topsoil gently and check if roots are circling drainage holes.',
      fertilizer: 'Top-dress pots with a handful of vermicompost to restore nutrients after monsoon.',
      pruning: 'Shape leggy monsoon vines and remove older faded leaves to encourage compact growth.',
      pestAndDisease: 'Inspect stems and leaf nodes for scale insects or mealybugs before winter sets in.',
      heatAndRainProtection: 'Mild transitional weather suits indoor plants well; avoid sudden exposure to direct midday sun.',
    },
    winter: {
      watering: 'Water sparingly in the morning only when soil dries deeper down; overwatering is the #1 winter risk.',
      sunlight: 'Place in the brightest indirect spot available to make up for shorter, gentler winter days.',
      soilMoisture: 'Keep soil on the drier side of normal so roots do not stay cold and damp overnight.',
      fertilizer: 'Pause or greatly reduce fertilizing until late February when new spring growth resumes.',
      pruning: 'Avoid heavy pruning; only remove dead or yellowing leaves.',
      pestAndDisease: 'Watch for root rot from cold wet soil and occasional scale or dust buildup on leaves.',
      heatAndRainProtection: 'Keep away from chilly open-window night drafts and cold exterior walls.',
    },
  },
  Flowering: {
    summer: {
      watering: 'Water deeply early in the morning (often daily or every 1–2 days for sun-exposed pots) to prevent bud drop.',
      sunlight: 'Provide 4–6 hours of gentle morning sun; shield delicate buds from harsh 1–4 PM afternoon glare.',
      soilMoisture: 'Mulch pot surfaces with dry leaves or cocopeat so root zones stay cool and evenly moist.',
      fertilizer: 'Use diluted potassium-rich organic liquid feeds (banana peel tea, seaweed) every 15–20 days; avoid strong dry chemical feeds in peak heat.',
      pruning: 'Deadhead spent blooms regularly and avoid hard structural pruning until heat eases.',
      pestAndDisease: 'Check tender flower buds for aphids, thrips, and white mealybugs; treat with evening neem oil spray.',
      heatAndRainProtection: 'Use 50% green shade net during peak April–May afternoons if buds scorch or wilt before noon.',
    },
    monsoon: {
      watering: 'Skip manual watering on rainy days; water only when the top inch dries during rain breaks.',
      sunlight: 'Keep in the brightest rain-protected outdoor spot available so flower bud formation continues.',
      soilMoisture: 'Ensure rapid drainage—waterlogged soil causes sudden bud drop and yellowing leaves.',
      fertilizer: 'Apply slow-release vermicompost and bone meal/rock phosphate sparingly; heavy rain washes liquid feeds away.',
      pruning: 'Lightly thin dense inner branches to allow airflow through the canopy and remove soggy spent flowers.',
      pestAndDisease: 'High risk of black spot, powdery mildew, and snails; spray preventive neem oil on dry mornings.',
      heatAndRainProtection: 'Protect delicate blooms from battering heavy downpours and stake tall flowering stems against monsoon winds.',
    },
    'post-monsoon': {
      watering: 'Maintain consistent watering every 1–2 days as clear sunny weather returns.',
      sunlight: 'Give full direct morning-to-early-afternoon sunlight to trigger abundant festive-season blooming.',
      soilMoisture: 'Keep soil moist yet airy; top-dress with fresh compost and loose loam.',
      fertilizer: 'Prime feeding season—apply vermicompost + phosphorus/potassium-rich organic booster every 2–3 weeks.',
      pruning: 'Perform light shaping and tip-pinching to multiply flowering shoots for peak autumn–winter blooms.',
      pestAndDisease: 'Monitor new flower shoots closely for aphids, budworms, and caterpillars.',
      heatAndRainProtection: 'Mostly ideal weather; guard newly pruned pots if sudden retreating October showers turn heavy.',
    },
    winter: {
      watering: 'Water in the morning every 2–3 days; avoid wetting petals or leaves in the evening.',
      sunlight: 'Maximize full direct winter sunlight (5–6+ hours) to keep blooms vibrant.',
      soilMoisture: 'Allow topsoil to lightly dry between waterings; cool damp nights slow evaporation.',
      fertilizer: 'Continue light organic bloom feeding for winter bloomers (rose, chrysanthemum, marigold); reduce feeding for summer-dormant shrubs.',
      pruning: 'Deadhead faded flowers regularly; save heavy pruning of warm-season bloomers (like jasmine) for late winter/early spring.',
      pestAndDisease: 'Watch for morning-dew powdery mildew and aphids on cool-weather buds.',
      heatAndRainProtection: 'Keep tropical bloomers slightly sheltered from cold night winds in cooler plateau/interior regions.',
    },
  },
  Vegetable: {
    summer: {
      watering: 'Water deeply every morning (and lightly in evening during heatwaves for shallow grow bags) so fruiting plants do not drop blossoms.',
      sunlight: 'Provide morning sun (4–5 hours) with filtered afternoon shade during intense April–May heat.',
      soilMoisture: 'Maintain steady moisture with thick organic mulch; uneven dry-wet swings cause blossom-end rot and bitter greens.',
      fertilizer: 'Feed every 10–14 days with mild liquid compost tea, Panchagavya, or vermicompost wash.',
      pruning: 'Remove lower yellow leaves and pinch bolted flower spikes on leafy herbs to extend harvest.',
      pestAndDisease: 'Watch closely for spider mites, leaf miners, and whiteflies; spray diluted neem oil + mild soap at dusk.',
      heatAndRainProtection: 'Shade tender leafy greens (coriander, palak) under 50% shade net or bright verandah light to prevent bolting.',
    },
    monsoon: {
      watering: 'Water only during dry gaps when top 1 inch of soil dries; avoid splashing muddy water onto lower leaves.',
      sunlight: 'Place containers in the sunniest open spot possible to keep fruiting vines productive through cloudy weeks.',
      soilMoisture: 'Use raised grow bags or elevated pots with extra drainage holes so vegetable roots never suffocate.',
      fertilizer: 'Top-dress with vermicompost and neem cake powder every 2–3 weeks to replenish leached nutrients.',
      pruning: 'Trim lower leaves touching damp soil and thin overcrowded foliage to maximize airflow.',
      pestAndDisease: 'High risk of fungal blight, damping-off, slugs, and fruit borers; inspect leaves every 2–3 days.',
      heatAndRainProtection: 'Shield delicate seedlings and leafy greens from pelting rain with a transparent sheet or balcony overhang.',
    },
    'post-monsoon': {
      watering: 'Steady watering every 1–2 days as warm sunny afternoons return.',
      sunlight: 'Full 5–6 hours of direct sunlight fuels rapid flowering and pod/fruit setting.',
      soilMoisture: 'Keep humus-rich soil evenly moist and aerated with light weekly soil scratching (mulching).',
      fertilizer: 'Peak feeding window—enrich beds and grow bags with vermicompost, wood ash, or organic potash.',
      pruning: 'Prune spent monsoon branches and stake heavy tomato, brinjal, or chilli stems.',
      pestAndDisease: 'Watch emerging tender shoots for aphids, caterpillars, and leaf-curl vectors (thrips/whiteflies).',
      heatAndRainProtection: 'Ideal growing window across Karnataka; keep drainage clear during occasional October thunder showers.',
    },
    winter: {
      watering: 'Water mid-morning every 2–3 days so foliage dries before cool evening dew sets in.',
      sunlight: 'Give maximum direct sunlight throughout the day for sweeter fruits and lush leafy greens.',
      soilMoisture: 'Keep soil lightly moist; cool weather prevents rapid drying.',
      fertilizer: 'Feed leafy and fruiting winter vegetables every 15–20 days with vermicompost or liquid organic manure.',
      pruning: 'Harvest outer leaves and mature pods frequently to stimulate continuous production.',
      pestAndDisease: 'Check leaves for powdery mildew from morning dew and aphids on tender tips.',
      heatAndRainProtection: 'Great season for tomatoes, brinjal, coriander, and palak; protect warm-season seedlings from chilly night winds.',
    },
  },
  Fruit: {
    summer: {
      watering: 'Water deeply and thoroughly every 1–2 days in the morning; deep root soaking prevents premature fruit drop.',
      sunlight: 'Most Indian fruit plants love full sun, though young potted saplings benefit from light afternoon shade during heatwaves.',
      soilMoisture: 'Spread a thick 2–3 inch organic mulch ring around the base (leaving the trunk clear) to retain moisture.',
      fertilizer: 'Use gentle organic liquid feeds or diluted vermicompost tea; avoid harsh chemical fertilizers during peak heat.',
      pruning: 'Avoid heavy pruning in peak summer; remove only dead or broken twigs so canopy shades developing fruits.',
      pestAndDisease: 'Watch for citrus leaf miner, mealybugs, and fruit flies; use yellow sticky traps or evening neem oil spray.',
      heatAndRainProtection: 'Protect young container fruit trees from scorching dry winds by grouping pots or draping light shade cloth.',
    },
    monsoon: {
      watering: 'Suspend regular watering during rainy spells; irrigate only if topsoil dries out for 2–3 consecutive dry days.',
      sunlight: 'Keep in an open sunny terrace or courtyard position so trees receive maximum available daylight.',
      soilMoisture: 'Verify container drainage is completely unobstructed—standing rainwater quickly rots citrus, papaya, and guava roots.',
      fertilizer: 'Apply well-rotted farmyard manure/vermicompost + neem cake at the start and end of monsoon.',
      pruning: 'Trim water-shoots, diseased twigs, and low branches to improve sunlight and wind penetration.',
      pestAndDisease: 'Inspect for fungal canker, black sooty mold, fruit rot, and stem borers; keep fallen leaves cleared from the pot surface.',
      heatAndRainProtection: 'Stake young potted fruit saplings firmly against strong monsoon gusts and prevent water pooling around the collar.',
    },
    'post-monsoon': {
      watering: 'Resume consistent deep watering every 2–3 days as rains recede and sunny days lengthen.',
      sunlight: 'Provide 6+ hours of direct sunlight to help ripen fruits and set new flower buds.',
      soilMoisture: 'Loosen topsoil gently and replenish mulch to conserve post-monsoon soil moisture.',
      fertilizer: 'Key nutrition phase—apply balanced organic compost, bone meal, and micronutrients/seaweed extract.',
      pruning: 'Perform light structural pruning after harvest to maintain manageable container size.',
      pestAndDisease: 'Watch new flushes for citrus leaf miner, aphids, and scale insects.',
      heatAndRainProtection: 'Ideal mild conditions for potting up saplings into larger containers or grow bags.',
    },
    winter: {
      watering: 'Reduce watering to every 3–5 days (morning only); slight dry periods even help trigger flowering in mango and citrus.',
      sunlight: 'Ensure unobstructed full winter sunlight all day.',
      soilMoisture: 'Allow the top 2 inches of soil to dry between deep waterings to prevent cold root stress.',
      fertilizer: 'Lightly feed fruiting winter varieties (lemon, guava); hold back heavy nitrogen on mango before flowering.',
      pruning: 'Remove dead wood and crossed branches cleanly before spring growth flush begins.',
      pestAndDisease: 'Inspect flower panicles and tender shoots for powdery mildew and hoppers during dewy mornings.',
      heatAndRainProtection: 'Shield very young tropical saplings (papaya, banana) from cold night breezes in plateau/interior areas.',
    },
  },
  'Medicinal & Traditional': {
    summer: {
      watering: 'Water early morning every 1–2 days (daily for small terracotta pots) to keep aromatic herbs lush and prevent wilting.',
      sunlight: 'Provide bright morning sun (4–5 hours) and gentle afternoon shelter during intense summer heatwaves.',
      soilMoisture: 'Keep soil lightly moist and well-aerated; add a thin cocopeat/dry-leaf mulch on sun-baked pots.',
      fertilizer: 'Feed lightly once a month with organic vermicompost or diluted cow-dung/compost tea (avoid harsh synthetics on edible herbs).',
      pruning: 'Pinch flower spikes regularly (especially on Tulsi and mint) to keep leaves abundant and aromatic.',
      pestAndDisease: 'Check leaf undersides for spider mites, aphids, and mealybugs; use mild organic neem oil spray and wash leaves before use.',
      heatAndRainProtection: 'Move smaller herb pots out of scorching midday concrete heat onto a shaded stand or balcony ledge.',
    },
    monsoon: {
      watering: 'Cut back watering sharply—water only when the top 1 inch feels dry; avoid overhead evening watering.',
      sunlight: 'Keep in the brightest rain-sheltered spot possible so medicinal leaves stay rich in essential oils.',
      soilMoisture: 'Fast drainage is critical; soggy soil rapidly causes root rot in Tulsi, aloe, doddapatre, and ginger.',
      fertilizer: 'Minimal feeding needed; add a spoon of neem cake + vermicompost monthly if rain leaches nutrients.',
      pruning: 'Trim damaged, spotted, or overcrowded lower leaves to keep stems airy and dry.',
      pestAndDisease: 'High risk of leaf spot, stem rot, and snails; remove affected leaves immediately and keep pot bottoms elevated.',
      heatAndRainProtection: 'Shelter potted herbs from continuous heavy downpours under an overhang or courtyard roof.',
    },
    'post-monsoon': {
      watering: 'Moderate regular watering every 1–3 days as bright sunshine returns.',
      sunlight: 'Give 4–6 hours of direct morning sun to boost healthy post-monsoon regrowth.',
      soilMoisture: 'Refresh top soil layer with fresh compost and loose red soil/sand mix if compacted by rains.',
      fertilizer: 'Apply organic vermicompost or well-rotted manure once a month to rebuild vitality before winter.',
      pruning: 'Prune back leggy monsoon growth by 20–30% to encourage dense, bushy branching.',
      pestAndDisease: 'Inspect fresh shoots for aphids, whiteflies, and caterpillars; gentle neem spray works well.',
      heatAndRainProtection: 'Excellent mild conditions for dividing rhizomes (ginger, turmeric, lemongrass) and propagating cuttings.',
    },
    winter: {
      watering: 'Water moderately mid-morning every 2–4 days; never leave medicinal herbs sitting in cold wet soil overnight.',
      sunlight: 'Give maximum warm morning sunlight to counter cool winter temperatures.',
      soilMoisture: 'Allow topsoil to dry gently between waterings; winter dew already adds surface moisture.',
      fertilizer: 'Reduce feeding to light vermicompost every 6–8 weeks as growth naturally slows.',
      pruning: 'Harvest gently and avoid harsh heavy pruning during cold months; remove dried seed stalks.',
      pestAndDisease: 'Watch for morning-dew powdery mildew and black aphids on tender stems.',
      heatAndRainProtection: 'Protect cold-sensitive traditional herbs like Tulsi from chilly winter night breeze and heavy dew.',
    },
  },
};

/**
 * Plant-specific overrides keyed by `PlantCatalogItem.id` from `src/data/plantDatabase.ts`.
 * Ensures signature Indian & household plants receive genuinely distinct, tailored care.
 */
export const PLANT_SPECIFIC_SEASONAL_OVERRIDES: Record<string, PlantSeasonalOverride> = {
  tulsi: {
    attentionBySeason: { summer: 'high', monsoon: 'high', 'post-monsoon': 'low', winter: 'high' },
    attentionReasonBySeason: {
      summer: 'Terracotta Tulsi pots dry quickly in afternoon heat—needs steady morning watering and light afternoon shade.',
      monsoon: 'Excessive rain and waterlogged pots are the #1 cause of Tulsi root rot during monsoon.',
      'post-monsoon': 'Thrives in mild post-monsoon sunshine—great time to pinch seeds and refresh compost.',
      winter: 'Cool night dew and chilly winds can stunt Tulsi; needs full warm morning sun and careful morning-only watering.',
    },
    seasons: {
      summer: {
        watering: 'Water deeply every morning; during peak April–May heat, check soil again in the evening if in a small terracotta pot.',
        pruning: 'Pinch off Manjari (flower spikes) regularly so energy goes into lush leaves instead of going to seed.',
        heatAndRainProtection: 'Give 4–5 hours of morning sun, then shelter from harsh 2–4 PM sun so leaves do not curl or scorch.',
      },
      monsoon: {
        watering: 'Monitor soil moisture carefully before watering—skip watering on rainy days and never allow saucer water to sit.',
        soilMoisture: 'Ensure the Tulsi katte or pot drains within seconds; top-dress with coarse sand if soil stays muddy.',
        heatAndRainProtection: 'Protect potted Tulsi from continuous heavy rainfall by moving under partial verandah cover during downpours.',
      },
      winter: {
        watering: 'Water lightly in the late morning only when the top inch dries; never pour cold water in the evening.',
        heatAndRainProtection: 'Place in a warm sunny spot and drape a light cotton cloth at night if temperatures drop sharply with heavy dew.',
      },
    },
  },
  hibiscus: {
    attentionBySeason: { summer: 'high', monsoon: 'moderate', 'post-monsoon': 'moderate', winter: 'low' },
    attentionReasonBySeason: {
      summer: 'High heat triggers bud drop and mealybug/aphid outbreaks—monitor watering and inspect buds closely.',
      monsoon: 'Loves monsoon warmth for vigorous growth, but watch closely for mealybugs, ants, and drainage.',
      'post-monsoon': 'Prime blooming season—regular organic feeding and pest checks maximize large daily flowers.',
      winter: 'Flowering naturally slows in cool nights; reduce watering slightly and hold hard pruning until February.',
    },
    seasons: {
      summer: {
        watering: 'Water deeply every morning during hot weather so buds stay plump and do not drop prematurely.',
        pestAndDisease: 'Watch closely for white cottony mealybugs and ants clustering on young flower buds; wash off with water jet and spray diluted neem oil at dusk.',
        heatAndRainProtection: 'Provide morning sun with filtered afternoon shade during intense dry heatwaves.',
      },
      monsoon: {
        watering: 'Water only on dry breaks when top 1 inch dries; ensure fast drainage so leaves do not turn yellow.',
        pruning: 'Lightly trim lanky shoots and take semi-hardwood cuttings—monsoon is ideal for propagating Dasavala.',
        pestAndDisease: 'Ants farm mealybugs and aphids during humid spells; treat early with neem oil + mild soap spray on dry mornings.',
      },
      'post-monsoon': {
        fertilizer: 'Feed every 15–20 days with vermicompost and potassium-rich organic booster (banana peel tea) for abundant blooms.',
      },
    },
  },
  'arabian-jasmine': {
    attentionBySeason: { summer: 'moderate', monsoon: 'high', 'post-monsoon': 'moderate', winter: 'low' },
    attentionReasonBySeason: {
      summer: 'Peak Mallige blooming season—needs full sun, regular watering, and bloom nutrition.',
      monsoon: 'Adjust watering carefully during monsoon and keep foliage airy to prevent fungal leaf spots and bud rot.',
      'post-monsoon': 'Flowering tapers after monsoon; ideal window to replenish soil and tidy overgrown vines.',
      winter: 'Semi-dormant in winter—reduce watering and prepare for late-February hard pruning.',
    },
    seasons: {
      summer: {
        watering: 'Water daily in the morning during peak flowering; never let potted Mallige wilt between waterings.',
        sunlight: 'Needs 5–6 hours of direct sunlight to produce fragrant white clusters.',
        fertilizer: 'Feed every 2 weeks with organic vermicompost or bone meal/seaweed extract for nonstop blooming.',
      },
      monsoon: {
        watering: 'Adjust watering downward during monsoon—water only when topsoil dries, and never let roots sit in wet clay.',
        sunlight: 'Keep in an open sunny balcony or terrace spot so vines receive maximum light between clouds.',
        pestAndDisease: 'Inspect buds for budworm and fungal spots; clear damp fallen petals from the pot surface.',
      },
      winter: {
        watering: 'Reduce watering to every 3–4 days as growth slows.',
        pruning: 'Wait until late winter (February) to prune back stems and strip old leaves for the big spring bloom flush.',
      },
    },
  },
  'golden-pothos': {
    attentionBySeason: { summer: 'low', monsoon: 'high', 'post-monsoon': 'low', winter: 'moderate' },
    attentionReasonBySeason: {
      summer: 'Thrives indoors if kept away from harsh window heat; occasional misting keeps leaves glossy.',
      monsoon: 'Avoid waterlogging during rainy periods—damp, low-light rooms easily cause yellow leaves and stem rot.',
      'post-monsoon': 'Ideal time to trim leggy vines and refresh moss sticks or water jars.',
      winter: 'Slows down in cool rooms—let soil dry deeper between waterings to avoid soggy cold roots.',
    },
    seasons: {
      summer: {
        watering: 'Water every 5–6 days when the top 1–2 inches dry; change water weekly for water-grown Money Plant cuttings.',
        sunlight: 'Keep in bright-to-medium indirect light; direct summer sun bleaches golden variegation.',
      },
      monsoon: {
        watering: 'Avoid waterlogging during rainy periods—stretch watering to every 8–10 days and empty drip trays promptly.',
        soilMoisture: 'Ensure porous cocopeat-perlite soil; yellowing lower leaves usually signal overwatering in humid monsoon air.',
        pruning: 'Pinch overgrown vine tips and propagate cuttings effortlessly in high monsoon humidity.',
      },
      winter: {
        watering: 'Water every 9–12 days in the morning only after soil dries well below the surface.',
      },
    },
  },
  'curry-leaf': {
    attentionBySeason: { summer: 'high', monsoon: 'moderate', 'post-monsoon': 'low', winter: 'high' },
    attentionReasonBySeason: {
      summer: 'Active growth peak for Karibevu—maintain consistent moisture, full sun, and organic feeding.',
      monsoon: 'Watch pot drainage carefully during heavy rain and inspect tender flushes for citrus butterflies/caterpillars.',
      'post-monsoon': 'Lush aromatic foliage—great time to harvest whole stalks and top-dress with compost.',
      winter: 'Naturally slows or drops some leaves in cool winter nights—cut back watering and maximize warm morning sun.',
    },
    seasons: {
      summer: {
        watering: 'Maintain suitable moisture by watering deeply every 1–2 days in the morning; avoid letting container soil bake dry.',
        sunlight: 'Provide 5–6 hours of bright sunlight for dense aromatic leaves.',
        fertilizer: 'Feed monthly with diluted sour buttermilk (1:10 with water) or vermicompost to encourage rich green flushes.',
      },
      monsoon: {
        soilMoisture: 'Keep soil well-draining; yellowing leaves during heavy rain indicate wet feet.',
        pestAndDisease: 'Check tender new shoots for lime swallowtail caterpillars and aphids; hand-pick or spray mild neem oil.',
      },
      winter: {
        watering: 'Cut watering back to every 4–5 days; dormant winter roots rot quickly in cold soggy soil.',
        pruning: 'Avoid heavy pruning in winter—wait until March for structural shaping.',
      },
    },
  },
  'aloe-vera': {
    attentionBySeason: { summer: 'low', monsoon: 'high', 'post-monsoon': 'low', winter: 'moderate' },
    attentionReasonBySeason: {
      summer: 'Tolerates Indian summer well, though harsh direct midday glare can turn leaves reddish-brown.',
      monsoon: 'High risk of crown and root rot if exposed to continuous rain—must be sheltered in monsoon.',
      'post-monsoon': 'Easy care; good time to separate offsets (pups) into well-draining gritty mix.',
      winter: 'Water very sparingly in cool weather so fleshy roots stay dry and healthy.',
    },
    seasons: {
      summer: {
        sunlight: 'Bright indirect light or gentle morning sun; afternoon glare scorches thick gel-filled leaves.',
        watering: 'Water deeply every 10–14 days only when soil is bone-dry.',
      },
      monsoon: {
        watering: 'Pause watering almost completely during wet humid weeks; water only every 2–3 weeks if completely dry.',
        heatAndRainProtection: 'Keep strictly under a rain-protected balcony or window ledge—standing rainwater causes rapid mushy rot.',
      },
    },
  },
  'snake-plant': {
    attentionBySeason: { summer: 'low', monsoon: 'high', 'post-monsoon': 'low', winter: 'moderate' },
    attentionReasonBySeason: {
      summer: 'Very hardy in warm rooms—just water sparingly when soil fully dries.',
      monsoon: 'High indoor humidity makes overwatering risky—stretch watering to 3–4 weeks.',
      'post-monsoon': 'Low maintenance; wipe leaves clean and enjoy steady growth.',
      winter: 'Dormant in cool months—water only once every 3–4 weeks.',
    },
    seasons: {
      monsoon: {
        watering: 'Water only every 21–28 days after checking that soil is completely dry down to the base.',
        soilMoisture: 'Zero standing moisture—soggy monsoon soil triggers soft, collapsing rhizomes.',
      },
    },
  },
  'fiddle-leaf-fig': {
    attentionBySeason: { summer: 'moderate', monsoon: 'high', 'post-monsoon': 'low', winter: 'moderate' },
    attentionReasonBySeason: {
      summer: 'Keep away from AC vents and direct midday glass glare to prevent crispy brown edges.',
      monsoon: 'Sensitive to overwatering and low cloudy light—stretch watering and maximize window light.',
      'post-monsoon': 'Great steady indoor conditions; wipe dust off large leaves and rotate weekly.',
      winter: 'Avoid cold drafts and reduce watering frequency during cooler weeks.',
    },
    seasons: {
      monsoon: {
        watering: 'Wait until the top 2–3 inches of soil are dry (often 12–16 days in monsoon) before watering thoroughly.',
        pestAndDisease: 'Brown spots with yellow halos indicate fungal root stress from damp soil—improve airflow immediately.',
      },
    },
  },
  'calathea-orbifolia': {
    attentionBySeason: { summer: 'high', monsoon: 'low', 'post-monsoon': 'low', winter: 'high' },
    attentionReasonBySeason: {
      summer: 'Dry summer heat curls leaf margins quickly—keep humidity high and use filtered water.',
      monsoon: 'Loves natural monsoon humidity, just avoid waterlogged pots.',
      'post-monsoon': 'Enjoys mild humidity and bright indirect light.',
      winter: 'Sensitive to cool dry drafts—water lightly with room-temperature filtered water.',
    },
    seasons: {
      summer: {
        watering: 'Keep soil lightly moist (never soggy) using filtered or rested water; dry air causes crispy brown rims.',
        heatAndRainProtection: 'Place on a pebble humidity tray away from ceiling fan drafts and AC vents.',
      },
    },
  },
  'indian-rose': {
    attentionBySeason: { summer: 'high', monsoon: 'high', 'post-monsoon': 'high', winter: 'moderate' },
    attentionReasonBySeason: {
      summer: 'Needs afternoon heat protection and frequent watering to prevent leaf scorch and thrips.',
      monsoon: 'Prone to black spot fungal disease in damp weather—needs airflow and preventive sprays.',
      'post-monsoon': 'October pruning and heavy organic feeding sets up the best winter rose blooms in Karnataka.',
      winter: 'Peak Gulabi blooming season—give full sun and watch for morning-dew powdery mildew.',
    },
    seasons: {
      'post-monsoon': {
        pruning: 'Perform annual light-to-medium October pruning and seal cut tips with turmeric or fungicide paste for lush winter blooms.',
        fertilizer: 'Top-dress with vermicompost, bone meal, and neem cake right after post-monsoon pruning.',
      },
      winter: {
        pestAndDisease: 'Avoid evening overhead watering to prevent powdery mildew and black spot on winter buds.',
      },
    },
  },
  'betel-leaf': {
    attentionBySeason: { summer: 'high', monsoon: 'moderate', 'post-monsoon': 'low', winter: 'high' },
    attentionReasonBySeason: {
      summer: 'Needs cool shade, misting, and moist moss poles to protect tender Veelyadele leaves from dry heat.',
      monsoon: 'Loves monsoon humidity, but guard the base from stem rot in waterlogged soil.',
      'post-monsoon': 'Thrives in gentle humidity and filtered light.',
      winter: 'Cold night winds can slow growth and yellow leaves—keep sheltered in warm indirect light.',
    },
    seasons: {
      summer: {
        sunlight: 'Keep strictly in cool bright shade—direct Indian summer sun scorches betel leaves quickly.',
        heatAndRainProtection: 'Mist the coir/moss support pole every morning to keep aerial roots cool and hydrated.',
      },
      monsoon: {
        soilMoisture: 'Keep soil evenly moist but never muddy; elevate pot slightly so excess monsoon rain exits freely.',
      },
    },
  },
  doddapatre: {
    attentionBySeason: { summer: 'low', monsoon: 'high', 'post-monsoon': 'low', winter: 'low' },
    attentionReasonBySeason: {
      summer: 'Thick fleshy leaves handle warm days well; give gentle morning sun.',
      monsoon: 'Fleshy stems rot quickly if pelted by nonstop monsoon rains—keep slightly sheltered with sharp drainage.',
      'post-monsoon': 'Grows vigorously; easy to propagate from a single stem cutting.',
      winter: 'Hardy through South Indian winters; water moderately in the morning.',
    },
    seasons: {
      monsoon: {
        watering: 'Allow soil to dry between waterings; fleshy Doddapatre stems store water and rot if waterlogged.',
        heatAndRainProtection: 'Keep under partial balcony/verandah cover during heavy rains.',
      },
    },
  },
  'indian-lemon': {
    attentionBySeason: { summer: 'high', monsoon: 'moderate', 'post-monsoon': 'moderate', winter: 'low' },
    attentionReasonBySeason: {
      summer: 'Deep consistent watering and mulch prevent flower and tiny-lemon drop in summer heat.',
      monsoon: 'Ensure sharp drainage and inspect new leaf flushes for citrus leaf miner.',
      'post-monsoon': 'Feed with compost + micronutrients to support fruiting and bright green foliage.',
      winter: 'Reduce watering slightly; full gentle winter sun encourages healthy flowering.',
    },
    seasons: {
      summer: {
        watering: 'Soak root zone deeply every 1–2 days in the morning; uneven moisture causes immature Nimbe fruit drop.',
      },
      monsoon: {
        pestAndDisease: 'Watch curly silver trails on young leaves (citrus leaf miner); spray diluted neem oil on new growth flushes.',
      },
    },
  },
};
