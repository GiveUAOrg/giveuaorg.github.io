from pathlib import Path
import os
from jinja2 import Template
import random

rootdir = Path('../assets/img/portfolio/')
htmldir = Path('../')

# Return a list of regular files only, not directories
file_list = [f for f in rootdir.glob('**/*') if f.is_file()]

items = []
for f in file_list:
    urlPath = Path(os.path.relpath(f, htmldir))
    items.append(
        {
            "url": urlPath.as_posix(),
            "filter": os.path.basename(urlPath.parent)
        }
    )
random.shuffle(items)

html_template = '''
{% for item in items %}
    <div class="col-lg-3 col-md-4 col-sm-6 portfolio-item filter-{{item.filter}}">
        <img src="{{item.url}}" class="img-fluid" alt="">
        <div class="portfolio-info">
            <h4>Ukraine Crisis</h4>
            <p>Get this as a free NFT</p>
            <a href="{{item.url}}" data-gallery="portfolioGallery" class="portfolio-lightbox preview-link" title="Donate to help Ukraine"><i class="bx bx-plus"></i></a>
        </div>
    </div>
{% endfor %}
'''

t = Template(html_template)
print(t.render(items=items))