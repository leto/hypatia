#!/usr/bin/perl -w
# Read-only RESTful API to GSL Special Functions
# Jonathan "Duke" Leto  <jonathan@leto.net> - Nov 2008
use strict;
use CGI ();
use CGI::Carp qw(fatalsToBrowser);
use Data::Dumper;
use HTML::Template;

my $q        = CGI->new;
my $tmpl_dir  = 'tmpl/';
my $index_tmpl = HTML::Template->new(filename => "$tmpl_dir/index.tmpl");

# fill in some parameters
# $index_tmpl->param( FOO => 42 );

print $q->header(-status => 200, -type => 'text/html');
print $index_tmpl->output;
