/**
 * Renders a JSON-LD block.
 *
 * The escaping is not optional. `JSON.stringify` does not escape `<`, `>` or
 * `/`, so a single `</script>` anywhere in the data would close this tag early
 * and hand the rest of the string to the HTML parser as markup — the classic
 * JSON-LD breakout. Nothing reaching this component is attacker-controlled
 * today (it is all static site config, repo-committed catalogue data and MDX
 * frontmatter), which is exactly why it is worth fixing now: the day someone
 * echoes a search param, a `?ref=` value or a customer testimonial into schema,
 * this stops being theoretical, and that change will not look dangerous.
 *
 * `\u003c` for `<` is sufficient on its own — no `<` means no `</script>` and no
 * `<!--`. U+2028 and U+2029 are also escaped because they are valid JSON but
 * illegal raw inside a script body, so a stray one in a description would be a
 * syntax error rather than a security issue.
 */
function serialize(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
