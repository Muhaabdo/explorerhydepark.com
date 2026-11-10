/**
 * "Inventory movement" article, written from the numbers in
 * tools/movement/<date>.json (made by tools/inventory-movement.py from two
 * availability reports). Every figure and every highlight in the text is
 * computed from that file, so a new edition is two steps:
 *
 *   python tools/inventory-movement.py old.json tools/inventory.json --from <date> --to <date>
 *   add  require('./articles-movement')('<to date>', '<slug>')  to tools/articles.js
 *
 * Wording rule: a unit that is no longer in the report "left the available
 * list" — the report doesn't say whether it was sold, reserved or withdrawn.
 */
var AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
var EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var TYPE_AR = { Apartment: 'شقق', Duplex: 'دوبلكس', 'Sky Villa': 'سكاي فيلا', 'Garden Villa': 'جاردن فيلا', Townhouse: 'تاون هاوس', Quad: 'كواد',
  'Twin House': 'توين هاوس', 'Twin House with Roof': 'توين هاوس بروف', Standalone: 'فيلا مستقلة', 'Small Villa': 'فيلا صغيرة',
  'Beach Medium Villa': 'فيلا شاطئ متوسطة', 'Standard Chalet': 'شاليه ستاندرد', 'Beach Chalet': 'شاليه شاطئ', Office: 'مكاتب', Clinic: 'عيادات' };
var TYPE_EN = { Apartment: 'apartments', Duplex: 'duplexes', 'Sky Villa': 'sky villas', 'Garden Villa': 'garden villas', Townhouse: 'townhouses', Quad: 'quads',
  'Twin House': 'twin houses', 'Twin House with Roof': 'twin houses with roof', Standalone: 'standalone villas', 'Small Villa': 'small villas',
  'Beach Medium Villa': 'beach medium villas', 'Standard Chalet': 'standard chalets', 'Beach Chalet': 'beach chalets', Office: 'offices', Clinic: 'clinics' };

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
function day(iso, lang) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return Number(m[3]) + ' ' + (lang === 'ar' ? AR_MONTHS : EN_MONTHS)[Number(m[2]) - 1] + ' ' + m[1];
}
function monthYear(iso, lang) {
  var m = /^(\d{4})-(\d{2})/.exec(iso);
  return (lang === 'ar' ? AR_MONTHS : EN_MONTHS)[Number(m[2]) - 1] + ' ' + m[1];
}
function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
function unitsAr(n) { return n === 1 ? 'وحدة واحدة' : n === 2 ? 'وحدتين' : n <= 10 ? n + ' وحدات' : n + ' وحدة'; }
function unitsEn(n) { return n + (n === 1 ? ' unit' : ' units'); }
function weeksAr(d) { var w = Math.round(d / 7); return w === 1 ? 'أسبوع' : w === 2 ? 'أسبوعين' : w <= 10 ? w + ' أسابيع' : w + ' أسبوع'; }
function weeksEn(d) { var w = Math.round(d / 7); return w + (w === 1 ? ' week' : ' weeks'); }
function segAr(s) {
  var t = TYPE_AR[s.type] || s.type;
  if (!s.rooms) return t;
  return t + ' ' + (s.rooms === 1 ? 'غرفة واحدة' : s.rooms === 2 ? 'غرفتين' : s.rooms + ' غرف');
}
function segEn(s) {
  var t = TYPE_EN[s.type] || s.type;
  return s.rooms ? s.rooms + '-bedroom ' + t : t;
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = function movementArticle(date, slug) {
  var M = require('./movement/' + date + '.json');
  var T = M.totals, days = daysBetween(M.from, M.to);
  var moved = M.projects.filter(function (p) { return p.left || p.entered; }).sort(function (a, b) { return b.left - a.left; });
  var fastest = moved[0];
  var grew = M.projects.filter(function (p) { return p.after > p.before; });
  var quiet = M.projects.filter(function (p) { return p.left + p.entered <= 2; });
  var segsOf = function (slug) { return M.segments.filter(function (s) { return s.slug === slug; }); };
  var oneBed = M.segments.filter(function (s) { return s.type === 'Apartment' && s.rooms === 1 && (s.before || s.after); });
  var sum = function (list, k) { return list.reduce(function (t, s) { return t + s[k]; }, 0); };
  // Shrinking with nothing new coming in / segments that got fresh stock.
  var tight = M.segments.filter(function (s) { return s.left >= 2 && !s.entered && s.after; })
    .sort(function (a, b) { return (b.left / b.before) - (a.left / a.before); }).slice(0, 6);
  var fresh = M.segments.filter(function (s) { return s.entered >= 2 && s.after > s.before; })
    .sort(function (a, b) { return b.entered - a.entered; }).slice(0, 5);

  function make(lang) {
    var AR = lang === 'ar';
    // Latin digits inside Arabic text use the site's number font.
    var n = function (x) { return AR ? '<bdi class="en">' + x + '</bdi>' : String(x); };
    var units = AR ? unitsAr : unitsEn, seg = AR ? segAr : segEn;
    var joinList = function (items) {
      if (items.length < 2) return items.join('');
      return AR ? items.slice(0, -1).join('، ') + ' و' + items[items.length - 1]
        : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
    };

    function body(c) {
      var name = function (s) { return c.esc(AR ? c.p(s).nameAr : c.p(s).nameEn); };
      var a = function (s) { return '<a href="' + c.link(s) + '">' + name(s) + '</a>'; };
      var table = function (head, rows) {
        return '<div class="pp-compare article__table"><table>\n<thead><tr>' +
          head.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead>\n<tbody>\n' +
          rows.map(function (r) {
            return '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>\n';
          }).join('') + '</tbody></table></div>\n';
      };
      var h2 = function (t) { return '<h2>' + t + '</h2>\n'; };
      var p = function (t) { return '<p>' + t + '</p>\n'; };
      var ul = function (items) { return '<ul>\n' + items.map(function (i) { return '<li>' + i + '</li>\n'; }).join('') + '</ul>\n'; };
      var out = '';

      /* ---- In brief ---- */
      var brief = [];
      brief.push(AR
        ? '<strong>الإجمالي:</strong> المتاح في مشاريع هايد بارك كان ' + n(T.before) + ' وحدة يوم ' + day(M.from, 'ar') + '، وبقى ' + n(T.after) + ' وحدة يوم ' + day(M.to, 'ar') + '.'
        : '<strong>Overall:</strong> Hyde Park’s projects had ' + T.before + ' units available on ' + day(M.from, 'en') + ' and ' + T.after + ' on ' + day(M.to, 'en') + '.');
      brief.push(AR
        ? '<strong>الحركة:</strong> ' + n(T.left) + ' وحدة خرجت من قائمة المتاح، و' + n(T.entered) + ' وحدة نزلت جديد.'
        : '<strong>Movement:</strong> ' + T.left + ' units left the available list and ' + T.entered + ' new units were added.');
      brief.push(AR
        ? '<strong>أسرع مشروع:</strong> ' + a(fastest.slug) + '، خرج منه ' + n(fastest.left) + ' وحدة' + (fastest.entered ? ' ونزل فيه ' + n(fastest.entered) + ' جديد' : '') + '.'
        : '<strong>Fastest-moving project:</strong> ' + a(fastest.slug) + ', where ' + unitsEn(fastest.left) + ' left the list' + (fastest.entered ? ' and ' + fastest.entered + ' were added' : '') + '.');
      if (grew.length) {
        brief.push(AR
          ? '<strong>اللي زاد:</strong> ' + joinList(grew.map(function (g) { return a(g.slug) + ' (من ' + n(g.before) + ' لـ ' + n(g.after) + ')'; })) + '.'
          : '<strong>Where stock grew:</strong> ' + joinList(grew.map(function (g) { return a(g.slug) + ' (' + g.before + ' to ' + g.after + ')'; })) + '.');
      }
      if (oneBed.length) {
        brief.push(AR
          ? '<strong>شقق الغرفة الواحدة:</strong> خرج منها ' + n(sum(oneBed, 'left')) + ' ' + (sum(oneBed, 'entered') ? 'ونزل ' + n(sum(oneBed, 'entered')) + ' جديد' : 'ومانزلش ولا وحدة جديدة') + '، فالمتاح نزل من ' + n(sum(oneBed, 'before')) + ' لـ ' + n(sum(oneBed, 'after')) + '.'
          : '<strong>One-bedroom apartments:</strong> ' + sum(oneBed, 'left') + ' left the list and ' + (sum(oneBed, 'entered') || 'none') + ' were added, taking the total from ' + sum(oneBed, 'before') + ' to ' + sum(oneBed, 'after') + '.');
      }
      brief.push(T.repriced
        ? (AR ? '<strong>الأسعار:</strong> ' + n(T.repriced) + ' وحدة اتغير سعرها وهي لسه متاحة.' : '<strong>Prices:</strong> ' + unitsEn(T.repriced) + ' changed price while still available.')
        : (AR ? '<strong>الأسعار:</strong> ولا وحدة من الـ' + n(T.unchanged) + ' اللي فضلت متاحة اتغير سعرها.' : '<strong>Prices:</strong> none of the ' + T.unchanged + ' units that stayed available changed price.'));
      out += h2(AR ? 'الخلاصة في سطور' : 'In brief') + ul(brief);

      /* ---- Method ---- */
      out += h2(AR ? 'الأرقام دي جاية منين؟' : 'Where these numbers come from');
      out += p(AR
        ? 'المطوّر بيطلّع تقرير بالوحدات المتاحة للبيع، كل وحدة برقمها وسعرها ومساحتها. قارنّا نسخة ' + day(M.from, 'ar') + ' بنسخة ' + day(M.to, 'ar') + '، وحدة بوحدة، في المشاريع اللي على الموقع.'
        : 'The developer issues a report of the units available for sale, each with its code, price and area. We compared the ' + day(M.from, 'en') + ' report with the ' + day(M.to, 'en') + ' one, unit by unit, for the projects on this site.');
      out += p(AR
        ? '<strong>مهم:</strong> لما وحدة تختفي من التقرير، ده معناه إنها <strong>خرجت من المتاح</strong>، مش بالضرورة إنها اتباعت. ممكن تكون اتحجزت، أو المطوّر سحبها. والتقرير مش بيقول السبب. عشان كده بنقول "خرجت" مش "اتباعت".'
        : '<strong>Note:</strong> when a unit disappears from the report, it has <strong>left the available list</strong> — not necessarily been sold. It may be reserved, or withdrawn by the developer, and the report doesn’t say which. That’s why we say “left the list”, not “sold”.');

      /* ---- By project ---- */
      out += h2(AR ? 'الحركة في كل مشروع' : 'Movement by project');
      out += table(
        AR ? ['المشروع', 'كان متاح', 'خرج', 'نزل جديد', 'المتاح دلوقتي'] : ['Project', 'Was available', 'Left', 'Added', 'Available now'],
        M.projects.slice().sort(function (x, y) { return y.left - x.left; }).map(function (r) {
          return [a(r.slug), n(r.before), n(r.left), n(r.entered), n(r.after)];
        }));

      moved.filter(function (pr) { return pr.left + pr.entered > 2; }).forEach(function (pr) {
        var segs = segsOf(pr.slug);
        var gone = segs.filter(function (s) { return s.left; }).sort(function (x, y) { return y.left - x.left; }).slice(0, 4);
        var came = segs.filter(function (s) { return s.entered; }).sort(function (x, y) { return y.entered - x.entered; }).slice(0, 4);
        var apts = segs.filter(function (s) { return s.type === 'Apartment' && s.left; });
        out += '<h3>' + a(pr.slug) + '</h3>\n';
        var txt = AR
          ? 'كان فيه ' + n(pr.before) + ' وحدة، وبقى ' + n(pr.after) + '.'
          : 'It had ' + unitsEn(pr.before) + ' and now has ' + pr.after + '.';
        if (gone.length) {
          txt += AR
            ? ' أكتر حاجة خرجت: ' + joinList(gone.map(function (s) { return seg(s) + ' (' + n(s.left) + ' من ' + n(s.before) + ')'; })) + '.'
            : ' What left most: ' + joinList(gone.map(function (s) { return seg(s) + ' (' + s.left + ' of ' + s.before + ')'; })) + '.';
        }
        if (came.length) {
          txt += AR
            ? ' ونزل جديد: ' + joinList(came.map(function (s) { return seg(s) + ' (' + n(s.entered) + ')'; })) + '.'
            : ' Newly added: ' + joinList(came.map(function (s) { return seg(s) + ' (' + s.entered + ')'; })) + '.';
        } else {
          txt += AR ? ' ومانزلش فيه أي وحدات جديدة.' : ' Nothing new was added.';
        }
        if (apts.length) {
          var lo = Math.min.apply(null, apts.map(function (s) { return s.leftMin; })), hi = Math.max.apply(null, apts.map(function (s) { return s.leftMax; }));
          txt += AR
            ? ' الشقق اللي خرجت كانت أسعارها ' + (lo === hi ? n(fmt(lo)) : 'من ' + n(fmt(lo)) + ' لـ ' + n(fmt(hi))) + ' جنيه.'
            : ' The apartments that left were priced ' + (lo === hi ? 'at EGP ' + fmt(lo) : 'from EGP ' + fmt(lo) + ' to ' + fmt(hi)) + '.';
        }
        out += p(txt);
      });
      if (quiet.length) {
        out += p(AR
          ? '<strong>الأهدى حركة:</strong> ' + joinList(quiet.map(function (q) { return a(q.slug) + ' (خرج ' + n(q.left) + ' ونزل ' + n(q.entered) + ')'; })) + '.'
          : '<strong>Least movement:</strong> ' + joinList(quiet.map(function (q) { return a(q.slug) + ' (' + q.left + ' left, ' + q.entered + ' added)'; })) + '.');
      }

      /* ---- One-bedroom apartments ---- */
      if (oneBed.length) {
        out += h2(AR ? 'شقق الغرفة الواحدة: المتاح وأقل سعر في كل مشروع' : 'One-bedroom apartments: availability and lowest price by project');
        out += p(AR
          ? 'دي أرخص طريقة تدخل بيها هايد بارك، وأكتر نوع الناس بتسأل عليه. الجدول مترتب من الأرخص، بأسعار تقرير ' + day(M.to, 'ar') + ':'
          : 'This is the lowest-priced way into Hyde Park and the type people ask about most. Sorted by price, from the ' + day(M.to, 'en') + ' report:');
        out += table(
          AR ? ['المشروع', 'كان متاح', 'خرج', 'المتاح دلوقتي', 'يبدأ من (جنيه)'] : ['Project', 'Was available', 'Left', 'Available now', 'From (EGP)'],
          oneBed.filter(function (s) { return s.after; }).sort(function (x, y) { return x.minAfter - y.minAfter; }).map(function (s) {
            return [a(s.slug), n(s.before), n(s.left), n(s.after), n(fmt(s.minAfter))];
          }));
      }

      /* ---- Prices ---- */
      out += h2(AR ? 'الأسعار: إيه اللي اتغير فعلاً؟' : 'Prices: what actually changed');
      out += p(T.repriced
        ? (AR ? n(T.repriced) + ' وحدة اتغير سعرها وهي لسه في قائمة المتاح.' : unitsEn(T.repriced) + ' changed price while still on the available list.')
        : (AR
          ? 'قارنّا سعر كل وحدة موجودة في التقريرين: <strong>الـ' + n(T.unchanged) + ' وحدة اللي فضلت متاحة كلها بنفس سعرها</strong>. يعني مفيش إعادة تسعير حصلت في الـ' + weeksAr(days) + ' دول.'
          : 'We compared the price of every unit that appears in both reports: <strong>all ' + T.unchanged + ' units that stayed available kept the same price</strong>. There was no repricing in these ' + weeksEn(days) + '.'));
      if (M.startMoves.length) {
        out += p(AR
          ? 'بس "السعر يبدأ من" اتحرك في كام نوع، لأن أرخص وحدة خرجت فبقى السعر يبدأ من اللي بعدها، أو لأن وحدة أرخص نزلت جديد:'
          : 'But the “from” price moved for a few types, because the cheapest unit left the list and the next one became the starting price, or because a cheaper unit was added:');
        out += table(
          AR ? ['المشروع', 'النوع', 'كان يبدأ من', 'بقى يبدأ من', 'الفرق'] : ['Project', 'Type', 'Was from', 'Now from', 'Change'],
          M.startMoves.map(function (s) {
            var pct = (s.after / s.before - 1) * 100;
            return [a(s.slug), AR ? TYPE_AR[s.type] : cap(TYPE_EN[s.type]), n(fmt(s.before)), n(fmt(s.after)), n((pct > 0 ? '+' : '') + pct.toFixed(1) + '%')];
          }));
      }

      /* ---- For the buyer ---- */
      out += h2(AR ? 'ده معناه إيه لو بتفكر تشتري؟' : 'What this means if you’re planning to buy');
      var tips = [];
      if (tight.length) {
        tips.push(AR
          ? '<strong>أنواع المتاح فيها بيقل ومفيش جديد نزل:</strong> ' + joinList(tight.map(function (s) { return seg(s) + ' في ' + a(s.slug) + ' (فاضل ' + n(s.after) + ')'; })) + '. لو عينك على واحد منهم، الاختيارات (الدور والاتجاه والمساحة) بتقل مع الوقت.'
          : '<strong>Types that are shrinking with nothing new added:</strong> ' + joinList(tight.map(function (s) { return seg(s) + ' in ' + a(s.slug) + ' (' + s.after + ' remaining)'; })) + '. If one of these is what you want, the choice of floor, view and size narrows over time.');
      }
      if (fresh.length) {
        tips.push(AR
          ? '<strong>أنواع نزل فيها مخزون جديد:</strong> ' + joinList(fresh.map(function (s) { return seg(s) + ' في ' + a(s.slug) + ' (نزل ' + n(s.entered) + ')'; })) + '. هنا الاختيارات دلوقتي أوسع من ' + weeksAr(days) + ' فاتوا.'
          : '<strong>Types that got new stock:</strong> ' + joinList(fresh.map(function (s) { return seg(s) + ' in ' + a(s.slug) + ' (' + s.entered + ' added)'; })) + '. There is more to choose from here than ' + weeksEn(days) + ' ago.');
      }
      tips.push(AR
        ? '<strong>السعر بيتحرك من غير إعلان:</strong> حتى من غير زيادة رسمية، لما الوحدات الأرخص تخرج، اللي بيفضل هو الأغلى. فسعر البداية اللي شايفه النهارده مرتبط بوحدة معينة ممكن ماتبقاش موجودة بعد كام أسبوع.'
        : '<strong>Prices move without an announcement:</strong> even with no official increase, when the cheaper units leave, what remains is the more expensive ones. Today’s “from” price is tied to a specific unit that may not be there in a few weeks.');
      tips.push(AR
        ? '<strong>الأرقام دي معلومة مش توصية:</strong> حركة ' + weeksAr(days) + ' بتوريك الاتجاه، بس قرار الشراء بيرجع لميزانيتك واحتياجك. ولازم تتأكد من توافر الوحدة وسعرها وقت الحجز.'
        : '<strong>This is information, not a recommendation:</strong> ' + weeksEn(days) + ' of movement shows a direction, but the decision depends on your budget and needs — and a unit’s availability and price must be confirmed at the time of booking.');
      out += ul(tips);
      out += c.wa(
        AR ? 'عايز أعرف الوحدات المتاحة دلوقتي في مشاريع هايد بارك حسب آخر تحديث للمخزون' : 'Hi, I’d like the units available now in Hyde Park projects, from the latest inventory update.',
        AR ? 'اسأل عن المتاح دلوقتي' : 'Ask what’s available now');

      /* ---- Full table ---- */
      out += h2(AR ? 'الجدول الكامل: كل نوع اتحرك' : 'Full table: every type that moved');
      out += table(
        AR ? ['المشروع', 'النوع', 'كان', 'خرج', 'نزل جديد', 'بقى'] : ['Project', 'Type', 'Was', 'Left', 'Added', 'Now'],
        M.segments.filter(function (s) { return s.left || s.entered; }).map(function (s) {
          return [a(s.slug), AR ? seg(s) : cap(seg(s)), n(s.before), n(s.left), n(s.entered), n(s.after)];
        }));
      return out;
    }

    var fastestName = function (L) { return L === 'ar' ? PROJECT_AR(fastest.slug) : PROJECT_EN(fastest.slug); };
    var cheapestOneBed = oneBed.filter(function (s) { return s.after; }).sort(function (x, y) { return x.minAfter - y.minAfter; })[0];

    if (AR) {
      return {
        title: 'حركة مخزون هايد بارك في ' + weeksAr(days) + ': ' + T.left + ' وحدة خرجت من المتاح و' + T.entered + ' نزلت جديد (' + monthYear(M.to, 'ar') + ')',
        seoTitle: 'مخزون هايد بارك ' + monthYear(M.to, 'ar') + ': إيه اللي خرج من المتاح؟',
        description: 'قارنّا تقرير المتاح للبيع من المطوّر يوم ' + day(M.from, 'ar') + ' ويوم ' + day(M.to, 'ar') + ': ' + T.left + ' وحدة خرجت و' + T.entered + ' نزلت جديد. أنهي مشروع ونوع بيتحرك أسرع، وإيه اللي حصل للأسعار.',
        lede: 'بين ' + day(M.from, 'ar') + ' و' + day(M.to, 'ar') + ' خرجت ' + T.left + ' وحدة من قائمة المتاح للبيع في مشاريع هايد بارك، ونزلت ' + T.entered + ' وحدة جديدة، فالمتاح نزل من ' + T.before + ' لـ ' + T.after + ' وحدة. المقالة دي بتوريك الحركة حصلت فين بالظبط: أنهي مشروع، وأنهي نوع وحدة، وإيه اللي اتغير في الأسعار.',
        body: body,
        faqs: [
          { q: 'هل الوحدات اللي خرجت من المتاح اتباعت؟', a: 'مش بالضرورة. تقرير المطوّر بيعرض الوحدات المتاحة للبيع بس، فلما وحدة تختفي منه ده معناه إنها خرجت من المتاح: ممكن تكون اتباعت، أو اتحجزت، أو المطوّر سحبها. التقرير مش بيقول السبب.' },
          { q: 'أنهي مشروع في هايد بارك المتاح فيه بيتحرك أسرع؟', a: 'بين ' + day(M.from, 'ar') + ' و' + day(M.to, 'ar') + ' كان ' + fastestName('ar') + ' الأسرع: خرج منه ' + fastest.left + ' وحدة من ' + fastest.before + '، ونزل فيه ' + fastest.entered + ' وحدة جديدة.' },
          { q: 'هل أسعار هايد بارك زادت في ' + monthYear(M.to, 'ar') + '؟', a: T.repriced
            ? T.repriced + ' وحدة اتغير سعرها وهي لسه متاحة بين ' + day(M.from, 'ar') + ' و' + day(M.to, 'ar') + '.'
            : 'مفيش وحدة اتغير سعرها: الـ' + T.unchanged + ' وحدة اللي فضلت متاحة بين ' + day(M.from, 'ar') + ' و' + day(M.to, 'ar') + ' كلها بنفس السعر. اللي اتحرك هو سعر البداية في ' + M.startMoves.length + ' أنواع، لأن أرخص وحدة خرجت أو وحدة أرخص نزلت.' },
          cheapestOneBed ? { q: 'لسه فيه شقق غرفة واحدة متاحة في هايد بارك؟', a: 'أيوه. حسب تقرير ' + day(M.to, 'ar') + ' فيه ' + sum(oneBed, 'after') + ' شقة غرفة واحدة متاحة في مشاريع هايد بارك (كانوا ' + sum(oneBed, 'before') + ')، وأقل سعر فيهم ' + fmt(cheapestOneBed.minAfter) + ' جنيه في ' + PROJECT_AR(cheapestOneBed.slug) + '.' } : null,
          { q: 'الأرقام دي بتتحدث إمتى؟', a: 'مع كل تقرير متاح جديد من المطوّر. الأرقام اللي هنا بتقارن تقرير ' + day(M.from, 'ar') + ' بتقرير ' + day(M.to, 'ar') + '، وأسعار كل مشروع على صفحته بتتحدث مع كل تقرير.' },
        ].filter(Boolean),
      };
    }
    return {
      title: 'Hyde Park inventory in ' + weeksEn(days) + ': ' + T.left + ' units left the available list, ' + T.entered + ' were added (' + monthYear(M.to, 'en') + ')',
      seoTitle: 'Hyde Park Inventory ' + monthYear(M.to, 'en') + ': What Left the Market',
      description: 'We compared the developer’s availability reports of ' + day(M.from, 'en') + ' and ' + day(M.to, 'en') + ': ' + T.left + ' units left, ' + T.entered + ' were added. Which projects and types move fastest.',
      lede: 'Between ' + day(M.from, 'en') + ' and ' + day(M.to, 'en') + ', ' + T.left + ' units left the available-for-sale list across Hyde Park’s projects and ' + T.entered + ' new units were added, taking availability from ' + T.before + ' to ' + T.after + ' units. This article shows exactly where the movement was: which project, which unit type, and what changed in prices.',
      body: body,
      faqs: [
        { q: 'Were the units that left the available list sold?', a: 'Not necessarily. The developer’s report lists only units available for sale, so a unit that disappears has left the available list: it may be sold, reserved, or withdrawn by the developer. The report doesn’t say which.' },
        { q: 'Which Hyde Park project is moving fastest?', a: 'Between ' + day(M.from, 'en') + ' and ' + day(M.to, 'en') + ' it was ' + fastestName('en') + ': ' + fastest.left + ' of its ' + fastest.before + ' units left the list and ' + fastest.entered + ' new units were added.' },
        { q: 'Did Hyde Park prices go up in ' + monthYear(M.to, 'en') + '?', a: T.repriced
          ? unitsEn(T.repriced) + ' changed price while still available between ' + day(M.from, 'en') + ' and ' + day(M.to, 'en') + '.'
          : 'No unit was repriced: all ' + T.unchanged + ' units that stayed available between ' + day(M.from, 'en') + ' and ' + day(M.to, 'en') + ' kept the same price. What moved is the starting price of ' + M.startMoves.length + ' unit types, because the cheapest unit left the list or a cheaper one was added.' },
        cheapestOneBed ? { q: 'Are one-bedroom apartments still available in Hyde Park?', a: 'Yes. As of the ' + day(M.to, 'en') + ' report there are ' + sum(oneBed, 'after') + ' one-bedroom apartments available across Hyde Park’s projects (down from ' + sum(oneBed, 'before') + '), starting from EGP ' + fmt(cheapestOneBed.minAfter) + ' in ' + PROJECT_EN(cheapestOneBed.slug) + '.' } : null,
        { q: 'How often are these numbers updated?', a: 'With every new availability report from the developer. The figures here compare the ' + day(M.from, 'en') + ' report with the ' + day(M.to, 'en') + ' one, and each project page’s prices are refreshed with every report.' },
      ].filter(Boolean),
    };
  }

  // Project names for the FAQ text (plain strings, built before the page context exists).
  var DATA = require('./projects-data'), DATA_LIST = Array.isArray(DATA) ? DATA : (DATA.projects || []);
  function find(slug) { return DATA_LIST.filter(function (x) { return x.slug === slug; })[0] || {}; }
  function PROJECT_AR(slug) { return find(slug).nameAr || slug; }
  function PROJECT_EN(slug) { return find(slug).nameEn || slug; }

  return {
    slug: slug,
    published: M.to,
    updated: M.to,
    related: moved.slice(0, 3).map(function (p) { return p.slug; }),
    sources: [
      { title: 'Hyde Park Developments — Sales Availability Report, ' + day(M.from, 'en') + ' (developer inventory export)' },
      { title: 'Hyde Park Developments — Sales Availability Report, ' + day(M.to, 'en') + ' (developer inventory export)' },
    ],
    ar: make('ar'),
    en: make('en'),
  };
};
