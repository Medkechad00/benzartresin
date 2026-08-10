/**
 * Product-specific Open Graph tags.
 *
 * Next's Metadata API cannot emit these correctly:
 *  - `openGraph.type` is a closed union that has no `product` member.
 *  - `metadata.other` renders every key as `<meta name="...">`, but the Open
 *    Graph protocol requires `<meta property="...">`. Crawlers that follow the
 *    spec (Pinterest and Facebook among them) ignore the `name` form outright,
 *    so routing these through `other` produces tags that look right in the
 *    HTML and do nothing.
 *
 * React 19 hoists `<meta>` elements rendered anywhere in the tree into
 * `<head>`, so rendering them here emits spec-correct `property` attributes.
 *
 * Note the two naming conventions are both intentional: Pinterest reads
 * `og:price:*`, Facebook reads `product:price:*`. They are cheap to emit and
 * mutually exclusive in practice.
 */
export function ProductOpenGraph({
  availability,
  price,
  currency = 'USD',
}: {
  availability: 'made-to-order' | 'sold';
  price?: number;
  currency?: string;
}) {
  const inStock = availability !== 'sold';

  return (
    <>
      <meta property="og:type" content="product" />
      <meta
        property="og:availability"
        content={inStock ? 'available for order' : 'out of stock'}
      />
      <meta
        property="product:availability"
        content={inStock ? 'available for order' : 'oos'}
      />
      <meta property="product:condition" content="new" />
      {price ? (
        <>
          <meta property="og:price:amount" content={String(price)} />
          <meta property="og:price:currency" content={currency} />
          <meta property="product:price:amount" content={String(price)} />
          <meta property="product:price:currency" content={currency} />
        </>
      ) : null}
    </>
  );
}
