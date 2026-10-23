# public-home-seo Specification

## Purpose
Defines the search-engine and social-sharing metadata, structured data and document language of the public homepage `/{locale}` (locales `vi` and `en`), so crawlers and link previews see a correct, localised, canonical description of the site without requiring any sign-in.

## Requirements

### Requirement: Localised title and description on the public homepage
The page at `/{locale}` SHALL expose a document title and a meta description written in the active locale, taken from the localised message catalogue, with the title no longer than 60 Unicode code points and the description no longer than 160. The page SHALL NOT expose the placeholder title `MyCourse FE` or the placeholder description `Next.js 16 starter with i18n and app stack`.

#### Scenario: Vietnamese homepage
- **WHEN** a visitor or crawler requests `/vi` without any session cookie
- **THEN** the HTML contains a non-empty Vietnamese `<title>` and `<meta name="description">`
- **AND** neither contains the text `MyCourse FE` or `Next.js 16 starter`

#### Scenario: English homepage
- **WHEN** a visitor or crawler requests `/en` without any session cookie
- **THEN** the HTML contains a non-empty English `<title>` and `<meta name="description">`

#### Scenario: Length limits
- **WHEN** the homepage metadata is generated for any locale
- **THEN** the title is at most 60 code points and the description at most 160 code points

### Requirement: Canonical URL and language alternates
The public homepage SHALL declare a canonical URL equal to the absolute site origin plus `/{locale}` of the requested locale, and SHALL declare language alternates for `vi`, `en` and `x-default`, where `x-default` points to the default locale (`vi`). All URLs SHALL be absolute and built from the configured site origin.

#### Scenario: Canonical for English
- **WHEN** `/en` is requested and the site origin is `https://example.com`
- **THEN** the head contains `<link rel="canonical" href="https://example.com/en">`

#### Scenario: Alternates
- **WHEN** either locale of the homepage is requested
- **THEN** the head contains `hreflang` alternates `vi` → `https://example.com/vi`, `en` → `https://example.com/en` and `x-default` → `https://example.com/vi`

### Requirement: Open Graph and Twitter tags without invented imagery
The public homepage SHALL expose Open Graph tags (type `website`, title, description, canonical URL, site name, locale) and Twitter card tags. It SHALL NOT emit an `og:image` or `twitter:image` tag unless a real image asset is configured.

#### Scenario: Social tags present
- **WHEN** `/vi` is requested
- **THEN** the head contains `og:title`, `og:description`, `og:url`, `og:site_name` and a `twitter:card` tag

#### Scenario: No fabricated image
- **WHEN** no site image is configured
- **THEN** the head contains no `og:image` and no `twitter:image` tag

### Requirement: Public homepage is indexable
The public homepage SHALL be indexable and followable by crawlers (no `noindex`), and SHALL be reachable by a crawler without authentication.

#### Scenario: Robots directive
- **WHEN** `/vi` is requested without a session cookie
- **THEN** the response status is 200 and the robots meta directive allows indexing and following

#### Scenario: Crawler never redirected
- **WHEN** a request without cookies for `/vi` or `/en` is made
- **THEN** the response is not a redirect to `/{locale}/home`

### Requirement: Organization structured data
The public homepage SHALL include a JSON-LD script of type `Organization` carrying only the site name and the site origin. It SHALL NOT include course, price, rating or instructor data derived from the homepage's placeholder (mock) content.

#### Scenario: Organization block
- **WHEN** `/vi` is requested
- **THEN** exactly one `application/ld+json` script of `@type` `Organization` is present with `name` equal to the site name and `url` equal to the site origin

#### Scenario: No mock data in structured data
- **WHEN** the JSON-LD of the homepage is inspected
- **THEN** it contains no course titles, prices, ratings or instructor names

### Requirement: Document language follows the locale
Every page SHALL set the `lang` attribute of the `<html>` element to the active locale instead of a fixed value.

#### Scenario: English page language
- **WHEN** any page under `/en` is rendered
- **THEN** the root element is `<html lang="en">`

#### Scenario: Vietnamese page language
- **WHEN** any page under `/vi` is rendered
- **THEN** the root element is `<html lang="vi">`

### Requirement: Root defaults are neutral
Pages that define no metadata of their own SHALL inherit the site name as their title and SHALL NOT inherit a description.

#### Scenario: Page without metadata
- **WHEN** a page without its own title is rendered
- **THEN** its title is the site name `MyCourse`
- **AND** no placeholder description is emitted
