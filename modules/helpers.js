export function registerHandlebarsHelpers() {




  Handlebars.registerHelper('select', function (selected, options) { 
    const escapedValue = RegExp.escape(Handlebars.escapeExpression(selected));
    const rgx = new RegExp(' value=[\"\']' + escapedValue + '[\"\']');
    const html = options.fn(this);
    return html.replace(rgx, "$& selected");    
  });




}