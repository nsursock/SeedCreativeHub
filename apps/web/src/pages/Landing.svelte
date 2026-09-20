<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { DISCIPLINES } from "@creative-hub/shared";
  import IconRocket from "@tabler/icons-svelte/icons/rocket";
  import IconUsers from "@tabler/icons-svelte/icons/users";
  import IconNetwork from "@tabler/icons-svelte/icons/affiliate";
  import IconArrowDown from "@tabler/icons-svelte/icons/arrow-down";
  import { enterShell, playLandingIntro, typewriter, countUp } from "@scifiui/core/js";
  import { getMessages, localePath, resolveHubMarket, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf } from "../lib/reveal";
  import { track } from "../lib/analytics";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let email = $state("");
  let selected = $state<string[]>(["photography"]);
  let status = $state<"idle" | "loading" | "ok" | "err">("idle");
  let errMsg = $state("");
  let root: HTMLElement | undefined = $state();
  let bootLine = $state("");
  let booted = $state(false);
  let stats = $state({ creators: 0, works: 0, nights: 0 });

  const glitchTitle = $derived(t(messages, "landing.heroGlitch"));

  type FeedRow = { t: string; who: string; what: string };
  const seedWho =
    resolveHubMarket() === "lebanon"
      ? ["@nour.png", "@beirut-synth", "@mariam.ink", "@studio-k", "@zee.wav", "@lens.lb"]
      : ["@nour.png", "@rio.loop", "@mariam.ink", "@studio-k", "@zee.wav", "@lens.nyc"];
  const seedWhat = [
    "published a work",
    "opened a collab",
    "joined the waitlist",
    "RSVP'd Hub Night",
    "featured on Explore",
    "claimed profile",
  ];
  let feed = $state<FeedRow[]>([
    { t: "21:04:52", who: seedWho[0]!, what: "published a work" },
    { t: "21:04:11", who: seedWho[1]!, what: "opened a collab" },
    { t: "21:03:48", who: seedWho[2]!, what: "joined the waitlist" },
    { t: "21:03:02", who: seedWho[3]!, what: "RSVP'd Hub Night" },
  ]);

  function toggle(d: string) {
    if (selected.includes(d)) selected = selected.filter((x) => x !== d);
    else selected = [...selected, d];
  }

  async function submit(e: Event) {
    e.preventDefault();
    status = "loading";
    errMsg = "";
    try {
      await gql(
        `mutation Join($input: JoinWaitlistInput!) {
          joinWaitlist(input: $input) { ok message }
        }`,
        { input: { email, disciplines: selected, locale } },
      );
      track("waitlist_join", {
        discipline_count: selected.length,
        locale,
      });
      status = "ok";
      email = "";
    } catch (err) {
      status = "err";
      errMsg = err instanceof Error ? err.message : t(messages, "common.error");
    }
  }

  onMount(() => {
    if (!root) return;
    enterShell(root);
    playLandingIntro(root);
    typewriter(t(messages, "landing.bootLine"), (s) => (bootLine = s), () => (booted = true), 22);
    countUp({ creators: 128, works: 340, nights: 12 }, (v) => (stats = v));

    const feedTimer = setInterval(() => {
      const row: FeedRow = {
        t: new Date().toLocaleTimeString("en-GB"),
        who: seedWho[Math.floor(Math.random() * seedWho.length)],
        what: seedWhat[Math.floor(Math.random() * seedWhat.length)],
      };
      feed = [row, ...feed].slice(0, 5);
    }, 2600);

    return () => clearInterval(feedTimer);
  });
</script>

<main bind:this={root} class="relative overflow-x-clip">
  <!-- ============ HERO ============ -->
  <section class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
    <div class="relative">
      <span class="ghost-word" aria-hidden="true">HUB</span>
      <p class="label-kicker neon-flicker text-scifi-primary mb-3">{t(messages, "landing.heroKicker")}</p>
      <h1
        class="hero-title hero-title-glitch mb-5 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
        data-text={glitchTitle}
      >
        {glitchTitle}
      </h1>
      <p class="hero-tagline mb-7 max-w-xl text-sm leading-relaxed sm:text-base">
        {t(messages, "landing.heroSub")}
      </p>
      <div class="mb-8 flex flex-wrap gap-2">
        <span class="feature-pill">{t(messages, "landing.pillA")}</span>
        <span class="feature-pill">{t(messages, "landing.pillB")}</span>
        <span class="feature-pill">{t(messages, "landing.pillC")}</span>
        <span class="feature-pill">{t(messages, "landing.pillD")}</span>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <a class="btn-cta gap-2" href="#waitlist">
          <IconRocket size={18} stroke={1.75} />
          {t(messages, "landing.heroCta")}
        </a>
        <a use:link class="cta-secondary" href={localePath(locale, "explore")}>{t(messages, "nav.explore")} →</a>
      </div>
      <p class="mt-4 text-[0.68rem] uppercase tracking-[0.14em] text-scifi-muted/70">
        {t(messages, "landing.heroTitle")}
      </p>
    </div>

    <!-- Live console -->
    <div class="console-panel float-y relative" aria-label="Hub preview">
      <div class="pane-scan"></div>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> {t(messages, "landing.consoleTitle")}</span>
        <span class="status-chip"><span class="dot"></span> seeding</span>
      </div>
      <div class="p-4 sm:p-5">
        <p class="mb-4 min-h-4 text-xs text-scifi-cyan {booted ? '' : 'caret-blink'}">
          $ {bootLine}{#if booted}&nbsp;<span class="text-scifi-success">✓ online</span>{/if}
        </p>
        <div class="mb-4 grid grid-cols-3 gap-2">
          <div class="stat-tile glass rounded-lg">
            <div class="stat-value text-lg sm:text-xl">{stats.creators}</div>
            <div class="stat-label">{t(messages, "nav.creators")}</div>
          </div>
          <div class="stat-tile glass rounded-lg">
            <div class="stat-value text-lg sm:text-xl">{stats.works}</div>
            <div class="stat-label">Works</div>
          </div>
          <div class="stat-tile glass rounded-lg">
            <div class="stat-value text-lg sm:text-xl">{stats.nights}</div>
            <div class="stat-label">Hub Nights</div>
          </div>
        </div>
        <p class="mb-2 text-[0.68rem] uppercase tracking-[0.18em] text-scifi-muted">signal</p>
        <ul class="m-0 list-none space-y-1.5 p-0 text-xs">
          {#each feed as f (f.t + f.who)}
            <li class="grid grid-cols-[4.4rem_1fr_auto] items-baseline gap-2">
              <span class="tabular-nums text-scifi-muted">{f.t}</span>
              <span class="truncate text-scifi-cyan">{f.who}</span>
              <span class="truncate text-scifi-muted">{f.what}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <!-- ============ MARQUEE ============ -->
  <div class="marquee mb-20 sm:mb-28" aria-hidden="true">
    <div class="marquee__track">
      {#each [...DISCIPLINES, ...DISCIPLINES] as d}
        <span class="marquee__item">{d.replaceAll("_", " ")}</span>
      {/each}
    </div>
  </div>

  <!-- ============ SUPPORT A / B ============ -->
  <section class="relative mx-auto mb-20 grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:mb-28">
    <article class="pane pane-bracketed card-lift relative p-6 sm:p-7" use:reveal>
      <span class="ghost-word" aria-hidden="true">01</span>
      <p class="label-kicker hub-section-kicker text-scifi-cyan">{t(messages, "landing.section01")}</p>
      <div class="mb-4 inline-flex rounded-lg border border-[var(--scifi-border-accent)] bg-[rgba(var(--scifi-primary-rgb),0.12)] p-2.5 text-scifi-primary">
        <IconUsers size={22} stroke={1.75} />
      </div>
      <h2 class="mb-2 text-xl font-bold sm:text-2xl">{t(messages, "landing.supportATitle")}</h2>
      <p class="m-0 text-sm leading-relaxed text-scifi-muted">{t(messages, "landing.supportABody")}</p>
    </article>
    <article class="pane pane-bracketed card-lift relative p-6 sm:p-7" use:reveal={120}>
      <span class="ghost-word" aria-hidden="true">02</span>
      <p class="label-kicker hub-section-kicker text-scifi-cyan">{t(messages, "landing.section02")}</p>
      <div class="mb-4 inline-flex rounded-lg border border-[var(--scifi-border-accent)] bg-[rgba(var(--scifi-cyan-rgb),0.12)] p-2.5 text-scifi-cyan">
        <IconNetwork size={22} stroke={1.75} />
      </div>
      <h2 class="mb-2 text-xl font-bold sm:text-2xl">{t(messages, "landing.supportBTitle")}</h2>
      <p class="m-0 text-sm leading-relaxed text-scifi-muted">{t(messages, "landing.supportBBody")}</p>
    </article>
  </section>

  <!-- ============ PRICING / FOUNDING ============ -->
  <section class="relative mb-20 w-full lg:mb-28" use:reveal>
    <div class="border-y border-[var(--scifi-border)] bg-[rgba(var(--scifi-primary-rgb),0.06)]">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div class="console-panel relative overflow-hidden">
          <div class="pane-scan"></div>
          <div class="pane-header">
            <span class="pane-title"><span class="pane-title-bar"></span> {t(messages, "landing.section03")}</span>
            <span class="badge badge-primary">{t(messages, "landing.pricingBadge")}</span>
          </div>
          <div class="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_auto]">
            <div>
              <h2 class="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t(messages, "landing.foundingTitle")}</h2>
              <p class="m-0 max-w-xl text-sm leading-relaxed text-scifi-muted sm:text-base">{t(messages, "landing.foundingBody")}</p>
              <p class="glow-text mt-5 text-xl font-bold text-scifi-primary sm:text-2xl">{t(messages, "landing.pricingPrice")}</p>
            </div>
            <div class="flex flex-col items-stretch gap-3">
              <a class="btn-cta justify-center" href="#waitlist">{t(messages, "landing.foundingCta")}</a>
              <a use:link class="cta-secondary justify-center" href={localePath(locale, "creators")}>{t(messages, "nav.creators")} →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <hr class="divider-spectrum mx-auto mb-20 max-w-4xl lg:mb-28" />

  <!-- ============ WAITLIST CTA ============ -->
  <section id="waitlist" class="relative mx-auto max-w-xl scroll-mt-28 px-4 py-4 sm:px-6" use:reveal>
    <div class="mb-6 text-center">
      <p class="label-kicker neon-flicker text-scifi-primary mb-2">// {t(messages, "landing.ctaTitle")}</p>
      <h2 class="hero-title text-3xl font-extrabold tracking-tight sm:text-4xl">{t(messages, "landing.ctaTitle")}</h2>
      <p class="mt-3 text-sm text-scifi-muted">{t(messages, "landing.ctaBody")}</p>
    </div>
    <div class="console-panel">
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> waitlist</span>
        <span class="status-chip"><span class="dot"></span> open</span>
      </div>
      <form class="space-y-5 p-5 sm:p-6" onsubmit={submit}>
        <label class="form-control w-full">
          <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "landing.email")}</span>
          <input class="input input-bordered w-full" type="email" required bind:value={email} placeholder="you@studio.lb" />
        </label>
        <fieldset>
          <legend class="label-kicker mb-2 text-scifi-muted">{t(messages, "landing.disciplines")}</legend>
          <div class="flex flex-wrap gap-2">
            {#each DISCIPLINES as d}
              <button
                type="button"
                class="feature-pill {selected.includes(d) ? 'border-[var(--scifi-primary)] text-scifi-primary' : ''}"
                onclick={() => toggle(d)}
              >
                {d.replaceAll("_", " ")}
              </button>
            {/each}
          </div>
        </fieldset>
        <button class="btn-cta w-full" type="submit" disabled={status === "loading" || selected.length < 1}>
          {t(messages, "landing.submit")}
        </button>
        {#if status === "ok"}
          <p class="text-center text-scifi-success">{t(messages, "landing.success")}</p>
        {/if}
        {#if status === "err"}
          <p class="text-center text-error">{errMsg}</p>
        {/if}
      </form>
    </div>
    <div class="mt-8 flex justify-center text-scifi-muted">
      <IconArrowDown size={18} class="float-y" />
    </div>
  </section>

  <!-- ============ FOOTER ============ -->
  <footer class="hub-footer mt-20 lg:mt-28">
    <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6">
      <div>
        <span class="brand-mark text-lg">{t(messages, "brand")}</span>
        <p class="mt-3 max-w-xs text-xs leading-relaxed text-scifi-muted">{t(messages, "landing.footer")}</p>
      </div>
      <nav class="flex flex-col gap-2 text-xs" aria-label="Footer">
        <span class="label-kicker mb-1 text-scifi-muted">map</span>
        <a use:link href={localePath(locale, "explore")}>{t(messages, "nav.explore")}</a>
        <a use:link href={localePath(locale, "creators")}>{t(messages, "nav.creators")}</a>
        <a use:link href={localePath(locale, "collaborate")}>{t(messages, "nav.collaborate")}</a>
        <a use:link href={localePath(locale, "events")}>{t(messages, "nav.events")}</a>
      </nav>
      <div class="flex flex-col gap-2 text-xs">
        <span class="label-kicker mb-1 text-scifi-muted">status</span>
        <span class="status-chip w-fit"><span class="dot"></span> phase 0 — seeding</span>
        <span class="text-scifi-muted">EN · FR · AR · HE</span>
      </div>
    </div>
  </footer>
</main>
